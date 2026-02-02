
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseAndImport } from './src/lib/excel-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    try {
        const realPath = 'd:/Dev/SPC/example_data/t(1).xlsx';
        console.log(`Reading file: ${realPath}`);

        const buffer = await fs.readFile(realPath);

        console.log("Starting import...");
        const result = await parseAndImport(buffer);
        console.log("Import Result:", result);
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

run();
