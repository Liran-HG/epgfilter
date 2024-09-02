// src/filterEpg.ts
import "dotenv/config";
import fs from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import * as zlib from "zlib";
import { promisify } from "util";
import axios from "axios";
import sax from "sax";
import { logger, LogLevel } from "./lib/logger";
const filterSW = process.env.FILTER_STARTS_WITH ?? "";
// Create a promisified version of the zlib gunzip function
const gunzip = promisify(zlib.gunzip);

// Define SaxNode interface
interface SaxNode {
  name: string;
  attributes: Record<string, string>;
}

// Define SaxNode interface
interface Program {
  channel: string;
  start: string;
  stop: string;
  title: string;
  description: string;
}

interface Channel {
  id: string;
}

// Function to determine if the source is a URL
const isUrl = (source: string): boolean => {
  try {
    new URL(source);
    return true;
  } catch {
    return false;
  }
};
function isGzipped(filename: string): boolean {
  return filename.toLowerCase().endsWith(".gz");
}
/**
 * Returns the XML data either as it is
 * or decompressed from a .gz file.
 *
 * The behavior can be enforced using the SOURCE_EPG_FORCED_FILE_TYPE env variable
 *
 * @param buffer The Buffer containing the EPG data.
 * @param source The source string.
 * @returns The decompressed Buffer or the original Buffer.
 */
async function getXmlDataFromBuffer(
  buffer: Buffer,
  source: string
): Promise<Buffer> {
  if (process.env.SOURCE_EPG_FORCED_FILE_TYPE?.toLowerCase() === "xml") {
    return buffer;
  } else if (process.env.SOURCE_EPG_FORCED_FILE_TYPE?.toLowerCase() == "gz") {
    return await gunzip(buffer);
  } else {
    return isGzipped(source) ? await gunzip(buffer) : buffer;
  }
}
async function fetchAndParseEpg(source: string) {
  try {
    let xmlData: Buffer;
    let relevantShow = false;
    const shows: Program[] = [];
    const channels: Channel[] = [];
    let generationDate: string = "";
    if (isUrl(source)) {
      // Fetch the .gz file from the URL
      const response = await axios.get<Buffer>(source, {
        responseType: "arraybuffer", // Get the response as a binary buffer
      });

      // Decompress the .gz file
      xmlData = await getXmlDataFromBuffer(response.data, source);
    } else {
      // Read and decompress the .gz file from the local filesystem
      const fileBuffer = fs.readFileSync(source);
      xmlData = await getXmlDataFromBuffer(fileBuffer, source);
    }
    // Create a SAX parser
    const parser = sax.createStream(true); // true for strict mode
    let nextTagExpectedTag: "PROGRAM" | "TITLE" | "DESC" = "PROGRAM";
    let currentProgram: Program = {
      channel: "",
      start: "",
      stop: "",
      title: "",
      description: "",
    };
    // Set up event listeners for parsing
    parser.on("opentag", (node: SaxNode) => {
      if (
        node.name == "tv" &&
        node.attributes?.["generation-date"] != undefined
      ) {
        generationDate = node.attributes?.["generation-date"];
      }
      if (node.name == "channel" && node.attributes?.id.startsWith(filterSW)) {
        channels.push({ id: node.attributes?.id });
      }
      // new program, reset everything
      if (node.name == "programme") {
        if (node.attributes.channel?.startsWith(filterSW)) {
          relevantShow = true;

          currentProgram = {
            channel: node.attributes.channel,
            start: node.attributes.start ?? "",
            stop: node.attributes.stop ?? "",
            title: "",
            description: "",
          };

          nextTagExpectedTag = "TITLE";
        } else {
          relevantShow = false;
        }
      }
    });
    parser.on("text", (text: string) => {
      if (!relevantShow) return;
      if (nextTagExpectedTag == "TITLE") {
        currentProgram.title = text;
        nextTagExpectedTag = "DESC";
      }
      if (nextTagExpectedTag == "DESC") {
        currentProgram.description = text;
      }
      logger.log(LogLevel.SILLY, "Parsed Text:", text);
    });

    parser.on("closetag", (tagName: string) => {
      if (!relevantShow) return;
      if (tagName == "programme") {
        logger.log(LogLevel.DEBUG, "Finished parsing program:", currentProgram);
        shows.push(currentProgram);
      }
      if (tagName == "desc") nextTagExpectedTag = "PROGRAM";
      logger.log(LogLevel.SILLY, "Closing tag:", tagName);
    });

    parser.on("end", () => {
      logger.log(LogLevel.INFO, "XML parsing completed.");
      createXmlFromData(generationDate, shows, channels);
    });

    parser.on("error", (error: Error) => {
      logger.log(LogLevel.ERROR, "Error during XML parsing:", error);
    });

    // Convert the decompressed buffer to a string and pipe to the SAX parser
    parser.write(xmlData.toString("utf-8"));
    parser.end();
  } catch (error) {
    logger.log(
      LogLevel.ERROR,
      "Error fetching or processing the EPG file:",
      error
    );
  }
}

// Function to filter the EPG file
export function filterEpg(): void {
  try {
    let file: string = process.env.SOURCE_EPG_LOCAL_FILE ?? "epg.xml";
    if (!(process.env.SOURCE_USE_LOCAL_FILE?.toLowerCase() === "true")) {
      file = process.env.SOURCE_EPG_URL_PATH ?? "";
    }

    logger.log(LogLevel.INFO, "Using EPG file:", file);
    fetchAndParseEpg(file);
  } catch (error) {
    logger.log(LogLevel.ERROR, "Error filtering EPG:", error);
  }
}

function buildXml(
  programs: Program[],
  channels: Channel[],
  generationDate: string
): string {
  const epgLang = process.env.EPG_LANGUAGE ?? "en";
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressBooleanAttributes: false,
  });

  logger.log(LogLevel.INFO, "Building XML with data:", {
    channels: channels.length,
    programs: programs.length,
  });
  
  const xmlObject = {
    tv: {
      "@_generator-info-name":
        process.env.SOURCE_GENERATOR_INFO_NAME ?? "EPG Generator",
      "@_generation-date": generationDate,
      channel: channels.map((channel) => ({
        "@_id": channel.id,
        "display-name": channel.id,
      })),
      programme: programs.map((program) => ({
        "@_channel": program.channel,
        "@_start": program.start,
        "@_stop": program.stop,
        title: {
          "@_lang": epgLang,
          "#text": program.title,
        },
        desc: {
          "@_lang": epgLang,
          "#text": program.description,
        },
      })),
    },
  };
  logger.log(LogLevel.DEBUG, "XML Object made");

  // Build the XML content
  const xmlContent = builder.build(xmlObject);

  // Prepend XML declaration and doctype
  const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const doctype = '<!DOCTYPE tv SYSTEM "https://raw.githubusercontent.com/XMLTV/xmltv/master/xmltv.dtd">';

  // Combine everything into the final XML string
  return `${xmlDeclaration}\n${doctype}\n${xmlContent}`;
}

function createXmlFromData(
  generationDate: string,
  shows: Program[],
  channels: Channel[]
) {
  const res = buildXml(shows, channels, generationDate);
  fs.writeFileSync(process.env.EPG_OUTPUT_FILE_PATH ?? "epg.xml", res, "utf-8");
  logger.log(
    LogLevel.INFO,
    "XML file created:",
    process.env.EPG_OUTPUT_FILE_PATH ?? "epg.xml"
  );
  logger.log(LogLevel.INFO, "FInished creating filtered EPG.");
}
