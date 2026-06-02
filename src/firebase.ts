import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let db: admin.firestore.Firestore | null = null;
let isFirebaseActive = false;

try {
  let serviceAccount: any = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // 1. Prioritize environment variable (Render deploy)
    console.log("Initializing Firebase from Environment Variable...");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // 2. Fall back to local file (Local development)
    const localKeyPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(localKeyPath)) {
      console.log("Initializing Firebase from local service-account.json...");
      const fileContent = fs.readFileSync(localKeyPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    isFirebaseActive = true;
    console.log("🔥 Firebase Admin SDK initialized successfully!");
  } else {
    console.warn("⚠️ No Firebase credentials found. Environment variable 'FIREBASE_SERVICE_ACCOUNT' is not set, and 'service-account.json' is missing in root.");
    console.warn("Logs will fall back to local database/console.");
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error);
}

export { db as firestore, isFirebaseActive };
