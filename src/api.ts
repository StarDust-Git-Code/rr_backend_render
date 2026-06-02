import { Router } from 'express';
import { db } from './db.js';
import { getLiveSnapshot, getAllLiveSnapshots } from './liveData.js';
import { firestore, isFirebaseActive } from './firebase.js';
import crypto from 'crypto';

export const apiRouter = Router();

// --- Auth ---
apiRouter.get('/auth/me', (req, res) => {
  // Mock operator profile since we bypass Firebase Auth for local
  res.json({
    uid: 'local-operator',
    displayName: 'Local Operator',
    clearance: 'admin',
    avatarUrl: ''
  });
});

// --- Rovers ---
apiRouter.get('/rovers', (req, res) => {
  const rovers = db.prepare('SELECT * FROM rovers').all();
  const result = rovers.map((r: any) => ({
    ...r,
    status: getLiveSnapshot(r.id) || null
  }));
  res.json(result);
});

apiRouter.get('/rovers/:roverId', (req, res) => {
  const { roverId } = req.params;
  const rover = db.prepare('SELECT * FROM rovers WHERE id = ?').get(roverId);
  if (!rover) {
    return res.status(404).json({ error: 'Rover not found' });
  }
  res.json({
    ...rover,
    status: getLiveSnapshot(roverId) || null
  });
});

apiRouter.get('/rovers/:roverId/status', (req, res) => {
  const { roverId } = req.params;
  const status = getLiveSnapshot(roverId);
  if (!status) return res.status(404).json({ error: 'Status not available' });
  res.json(status);
});

apiRouter.post('/rovers/:roverId/commands', (req, res) => {
  const { roverId } = req.params;
  const { type, payload } = req.body;
  
  console.log(`Command received for ${roverId}: ${type}`, payload);
  // Here we would push this command to the MQTT broker or direct to rover.
  // For now, just log and return success.
  
  res.json({ success: true, commandId: crypto.randomBytes(4).toString('hex') });
});

// --- Telemetry ---
apiRouter.get('/telemetry/:roverId', (req, res) => {
  const { roverId } = req.params;
  const { metric, limit = 100 } = req.query;
  
  let query = 'SELECT * FROM telemetry WHERE roverId = ?';
  const params: any[] = [roverId];
  
  if (metric) {
    query += ' AND metric = ?';
    params.push(metric);
  }
  
  query += ' ORDER BY ts DESC LIMIT ?';
  params.push(limit);
  
  const results = db.prepare(query).all(...params);
  res.json(results);
});

// --- Logs ---
apiRouter.get('/logs', async (req, res) => {
  const { roverId, limit = 50 } = req.query;

  if (isFirebaseActive && firestore) {
    try {
      console.log("Fetching logs from Firestore...");
      let queryRef: any = firestore.collection('logs').orderBy('ts', 'desc');
      if (roverId) {
        queryRef = queryRef.where('roverId', '==', roverId);
      }
      queryRef = queryRef.limit(Number(limit));
      
      const snapshot = await queryRef.get();
      const logs = snapshot.docs.map((doc: any) => doc.data());
      return res.json(logs);
    } catch (error) {
      console.error("❌ Failed to fetch logs from Firestore, falling back to SQLite:", error);
    }
  }
  
  let query = 'SELECT * FROM logs';
  const params: any[] = [];
  
  if (roverId) {
    query += ' WHERE roverId = ?';
    params.push(roverId);
  }
  
  query += ' ORDER BY ts DESC LIMIT ?';
  params.push(Number(limit));
  
  const results = db.prepare(query).all(...params);
  res.json(results);
});

// --- Missions ---
apiRouter.get('/missions', (req, res) => {
  const results = db.prepare('SELECT * FROM missions').all();
  res.json(results);
});
