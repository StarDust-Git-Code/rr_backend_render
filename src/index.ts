import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { apiRouter } from './api.js';
import { setupWebSockets } from './websocket.js';
import { startWorker } from './worker.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// REST API
app.use('/api/v1', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server
const httpServer = createServer(app);

// Setup WebSockets
const io = setupWebSockets(httpServer);

// Start Mock Data Worker
startWorker(io);

// Start listening
httpServer.listen(port, () => {
  console.log(`Road Rever Backend running on http://localhost:${port}`);
});
