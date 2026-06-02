import { Server as SocketServer } from 'socket.io';
import { db } from './db.js';
import { updateLiveSnapshot, RoverStatus } from './liveData.js';
import { firestore, isFirebaseActive } from './firebase.js';
import crypto from 'crypto';

export function startWorker(io: SocketServer) {
  // Initialize some fake rovers
  const rovers = ['RR-01', 'RR-02', 'RR-03', 'RR-04', 'RR-05'];
  
  // Seed rovers in DB if they don't exist
  const insertRover = db.prepare('INSERT OR IGNORE INTO rovers (id, name, model, commissionedAt, baseStation) VALUES (?, ?, ?, ?, ?)');
  rovers.forEach((id, idx) => {
    insertRover.run(id, `Rover ${id.replace('RR-', '')}`, 'Mark IV', new Date().toISOString(), `Station ${idx % 2 + 1}`);
  });

  console.log("Started Mock Data Generation Worker");

  setInterval(() => {
    const now = new Date().toISOString();
    rovers.forEach(roverId => {
      // Generate some fake movement/state
      const isMoving = Math.random() > 0.3;
      const state = isMoving ? (Math.random() > 0.8 ? 'DISPENSING' : 'NAVIGATING') : 'IDLE';
      
      const status: RoverStatus = {
        roverId,
        ts: now,
        position: {
          x: 40 + Math.random() * 10,
          y: 10 + Math.random() * 5,
          z: 0.0,
          heading: Math.random() * 360,
        },
        battery: {
          percent: 50 + Math.floor(Math.random() * 50),
          etaMinutes: 120 + Math.floor(Math.random() * 60),
          voltage: 28.4
        },
        mixture: { liters: 10 + Math.random() * 10, capacity: 20 },
        water: { liters: 5 + Math.random() * 15, capacity: 20 },
        state,
        runtimeMinutes: 2000 + Math.floor(Math.random() * 1000)
      };

      // Update in-memory state
      updateLiveSnapshot(roverId, status);

      // Push to connected clients via WebSockets
      io.emit(`rover:${roverId}:status`, status);

      // Periodically generate telemetry records
      if (Math.random() > 0.7) {
        const insertTelemetry = db.prepare('INSERT INTO telemetry (roverId, metric, value, unit, source, ts) VALUES (?, ?, ?, ?, ?, ?)');
        const powerValue = 1.0 + Math.random() * 2.0;
        insertTelemetry.run(roverId, 'power_kwh', powerValue, 'kW/h', 'bms.bus0', now);
        
        io.emit(`rover:${roverId}:telemetry`, {
          roverId, metric: 'power_kwh', value: powerValue, unit: 'kW/h', source: 'bms.bus0', ts: now
        });
      }

      // Periodically generate logs
      if (Math.random() > 0.95) {
        const logId = `log_${crypto.randomBytes(8).toString('hex')}`;
        const msg = "Obstacle detected, evasive maneuver in progress.";
        const contextStr = JSON.stringify({ speed: 0.5 });
        
        const logData = {
          id: logId,
          roverId,
          level: 'warn',
          code: 'WARN_OBSTACLE',
          subsystem: 'navigation',
          message: msg,
          context: contextStr,
          ts: now
        };

        if (isFirebaseActive && firestore) {
          firestore.collection('logs').doc(logId).set(logData)
            .then(() => console.log(`[Firestore] Log saved: ${logId}`))
            .catch(err => console.error("❌ Firestore log write error:", err));
        } else {
          const insertLog = db.prepare('INSERT INTO logs (id, roverId, level, code, subsystem, message, context, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
          insertLog.run(logId, roverId, 'warn', 'WARN_OBSTACLE', 'navigation', msg, contextStr, now);
        }
        
        io.emit(`rover:${roverId}:logs`, {
          id: logId, roverId, level: 'warn', code: 'WARN_OBSTACLE', subsystem: 'navigation', message: msg, ts: now
        });
      }
    });
  }, 2000); // run every 2 seconds
}
