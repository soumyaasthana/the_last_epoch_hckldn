import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const duckdb = require('duckdb');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DuckDB in memory
const db = new duckdb.Database(':memory:');

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Ensure your parquet file is named 'data.parquet' in this folder
  const PARQUET_FILE_PATH = path.join(__dirname, 'data.parquet');

  // --- API: FETCH COUNCILS ---
  app.get("/api/councils", (req, res) => {
  if (!fs.existsSync(PARQUET_FILE_PATH)) {
    return res.status(404).json({ error: "data.parquet not found" });
  }

  // UPDATED: Changed "council" to "council_name" based on your error log
  const query = `
    SELECT DISTINCT "council_name" 
    FROM '${PARQUET_FILE_PATH}' 
    WHERE "council_name" IS NOT NULL 
    ORDER BY "council_name" ASC
  `;

  db.all(query, (err: any, rows: any[]) => {
    if (err) {
      console.error("❌ DuckDB Error:", err);
      return res.status(500).json({ error: err.message });
    }
    // Updated to map "council_name"
    const names = rows.map(row => row.council_name);
    console.log(`✅ Found ${names.length} unique councils`);
    res.json(names);
  });
});

  // --- VITE MIDDLEWARE (UI Handlers) ---
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  app.use(vite.middlewares);

  app.get('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      next(e);
    }
  });

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running: http://localhost:${PORT}`);
    console.log(`📊 Reading Parquet: ${PARQUET_FILE_PATH}`);
  });
}

startServer();