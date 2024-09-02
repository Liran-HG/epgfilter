import "dotenv/config";
import express from "express";
import { CronJob } from "cron";
import fs from "fs";
import { filterEpg } from "./filterEpg";
import path from "path";
import { logger, LogLevel } from "./lib/logger";
import packageJson from "../package.json";

const app = express();
const port = process.env.PORT ?? 3000;

const filteredEpgFilePath = path.join(
  process.cwd(),
  process.env.EPG_OUTPUT_FILE_PATH ?? "epg.xml"
);

const filterEPG = () => {
  logger.log(LogLevel.INFO, "Filtering EPG ...");
  filterEpg();
};
// Cron job to run the filter function periodically
const job = new CronJob(
  `0 */${process.env.FETCH_HOUR_INTERVAL ?? 12} * * *`,
  () => {
    filterEPG();
  }
);

job.start();
if (!(process.env.FETCH_ON_START?.toLowerCase() === "false")) filterEPG();

app.get(process.env.EPG_OUTPUT_API_RESULT_PATH ?? "/epg.xml", (req, res) => {
  // Read the filtered EPG file
  fs.readFile(filteredEpgFilePath, "utf-8", (err, data) => {
    if (err) {
      // Handle error, e.g., file not found or read error
      logger.log(LogLevel.ERROR, "Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    // Set the appropriate Content-Type header for XML
    res.setHeader("Content-Type", "application/xml");

    // Send the file contents as a response
    res.send(data);
  });
});

// Basic endpoint to serve the filtered EPG file
app.get("/trigger", (req, res) => {
  setImmediate(() => filterEPG());
  res.status(200).send("Filtering process has been triggered.");
});

// Returns the crontab timer string
app.get("/crontime", (req, res) => {
  res.status(200).send(`0 */${process.env.FETCH_HOUR_INTERVAL ?? 12} * * *`);
});

app.listen(port, () => {
  logger.log(LogLevel.INFO, `Server running at http://localhost:${port} ...`);
});


logger.log(LogLevel.INFO, `App Version: ${packageJson.version}`);
logger.log(
  LogLevel.INFO,
  `Fetching EPG every ${process.env.FETCH_HOUR_INTERVAL ?? 12} hours ...`
);
logger.log(
  LogLevel.INFO,
  `Source EPG URL path: ${process.env.SOURCE_EPG_URL_PATH ?? "UNSET"}`
);
logger.log(
  LogLevel.INFO,
  `Source EPG File path: ${process.env.SOURCE_EPG_LOCAL_FILE ?? "UNSET"}`
);
logger.log(
  LogLevel.INFO,
  `Using local EPG File: ${
    process.env.SOURCE_USE_LOCAL_FILE?.toLowerCase() === "true" ? "YES" : "NO"
  }`
);