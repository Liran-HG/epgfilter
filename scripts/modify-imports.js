import { fileURLToPath } from 'url';
import fs from "fs";

import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = path.join(__dirname, '../dist');

function modifyImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/from\s+["'](\.\/[a-zA-Z0-9_]+)(?!\.js)["']/g, 'from "$1.js"');
  fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      modifyImports(fullPath);
    }
  });
}

processDirectory(distDir);
