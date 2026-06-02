import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists (using .data for persistence on platforms like Glitch)
const dataDir = path.join(process.cwd(), '.data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(path.join(dataDir, 'road-rever.db'));

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS rovers (
    id TEXT PRIMARY KEY,
    name TEXT,
    model TEXT,
    commissionedAt TEXT,
    baseStation TEXT
  );

  CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roverId TEXT,
    metric TEXT,
    value REAL,
    unit TEXT,
    source TEXT,
    ts TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    roverId TEXT,
    level TEXT,
    code TEXT,
    subsystem TEXT,
    message TEXT,
    context TEXT,
    ts TEXT
  );

  CREATE TABLE IF NOT EXISTS faults (
    id TEXT PRIMARY KEY,
    roverId TEXT,
    severity TEXT,
    subsystem TEXT,
    message TEXT,
    acknowledged BOOLEAN,
    ts TEXT
  );

  CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    roverId TEXT,
    sector TEXT,
    status TEXT,
    progress INTEGER,
    startedAt TEXT,
    etaAt TEXT,
    potholesFound INTEGER,
    potholesRepaired INTEGER
  );
`);

console.log("Database initialized at data/road-rever.db");
