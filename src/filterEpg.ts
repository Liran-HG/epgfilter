// src/filterEpg.ts
import 'dotenv/config';
import fs from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import * as zlib from "zlib";
import { promisify } from "util";
import axios from "axios";
import sax from "sax";
const filterSW = process.env.FILTER_STARTS_WITH ?? ""
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
      xmlData = await gunzip(response.data);
    } else {
      // Read and decompress the .gz file from the local filesystem
      const fileBuffer = fs.readFileSync(source);
      xmlData = await gunzip(fileBuffer);
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
          relevantShow = false
        }
      }

    });
    parser.on("text", (text: string) => {
      if(!relevantShow) return;
      if (nextTagExpectedTag == "TITLE") {
        currentProgram.title = text;
        nextTagExpectedTag = "DESC";
      }
      if (nextTagExpectedTag == "DESC") {
        currentProgram.description = text;
      }
      console.log("Text:", text);
    });

    parser.on("closetag", (tagName: string) => {
      if(!relevantShow) return;
      if (tagName == "programme") {
        console.log("Finished!", currentProgram);
        shows.push(currentProgram);
      }
      if (tagName == "desc") nextTagExpectedTag = "PROGRAM";
      console.log("Closing tag:", tagName);
    });

    parser.on("end", () => {
      console.log("XML parsing completed.");
      createXmlFromData(generationDate, shows, channels);
    });

    parser.on("error", (error: Error) => {
      console.error("Error during XML parsing:", error);
    });

    // Convert the decompressed buffer to a string and pipe to the SAX parser
    parser.write(xmlData.toString("utf-8"));
    parser.end();
  } catch (error) {
    console.error("Error fetching or processing the EPG file:", error);
  }
}

// Function to filter the EPG file
export function filterEpg(): void {
  try {

    let file:string = process.env.EPG_LOCAL_FILE ?? 'epg.xml';
    if(!(process.env.USE_LOCAL_FILE?.toLowerCase() === "true")){
      file=process.env.EPG_URL_PATH ?? ""
    }
    console.log("Using EPG file:", file);
    fetchAndParseEpg(file);
  } catch (error) {
    console.error("Error filtering EPG:", error);
  }
}

function buildXml(programs: Program[], channels: Channel[],generationDate: string): string {
  const epgLang = process.env.EPG_LANGUAGE ?? 'en';
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressBooleanAttributes: false
  });
  
  const xmlObject = {
    tv: {
      '@_generator-info-name': process.env.GENERATOR_INFO_NAME ?? 'EPG Generator',
      '@_generation-date': generationDate,
      channel: channels.map(channel => ({
        '@_id': channel.id,
        'display-name': channel.id
      })),
      programme: programs.map(program => ({
        '@_channel': program.channel,
        '@_start': program.start,
        '@_stop': program.stop,
        title: {
          '@_lang': epgLang,
          '#text': program.title
        },
        desc: {
          '@_lang': epgLang,
          '#text': program.description
        }
      }))
    }
  };


  return builder.build(xmlObject);

}


function createXmlFromData(
  generationDate: string,
  shows: Program[],
  channels: Channel[]
) {
  const res = buildXml(shows, channels,generationDate);
  fs.writeFileSync(process.env.EPG_OUTPUT_FILE_PATH ?? 'epg.xml', res, "utf-8");
}
