import express from "express";
import { CronJob } from "cron";
import fs from "fs";
import { filterEpg } from "./filterEpg";
import path from "path";
import { fileURLToPath } from "url";


const app = express();
const port = 3000;

const filteredEpgFilePath = path.join(process.cwd(),process.env.EPG_OUTPUT_FILE_PATH ?? 'epg.xml');

const filterEPG = () => {
  filterEpg();
};
// Cron job to run the filter function periodically
const job = new CronJob(`0 */${process.env.FETCH_HOUR_INTERVAL ?? 12} * * *`, () => {
  filterEPG();
});

job.start();

app.get("/epg.xml", (req, res) => {
  // Read the filtered EPG file
  fs.readFile(filteredEpgFilePath, 'utf-8', (err, data) => {
    if (err) {
      // Handle error, e.g., file not found or read error
      console.error('Error reading file:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Set the appropriate Content-Type header for XML
    res.setHeader('Content-Type', 'application/xml');

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
  console.log(`Server running at http://localhost:${port}. Fetching EPG every ${process.env.FETCH_HOUR_INTERVAL ?? 12} hours.`);
});
