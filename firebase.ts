
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "./firebase-applet-config.json";

// Use values from firebase-applet-config.json as the source of truth,
// but fall back to environment variables if config is missing or likely stale.
// In AI Studio, we should prefer the environment project ID if it exists.
const envProjectId = process.env.GOOGLE_CLOUD_PROJECT;
const targetProjectId = envProjectId || (firebaseConfig.projectId && !firebaseConfig.projectId.includes('TODO') ? firebaseConfig.projectId : undefined);

// Use the database ID from config if available, but allow override
// In AI Studio, we should prefer the named database if it's in the config,
// but fallback to (default) if it's missing or a placeholder.
const dbId = (firebaseConfig.firestoreDatabaseId && !firebaseConfig.firestoreDatabaseId.includes('TODO')) 
  ? firebaseConfig.firestoreDatabaseId 
  : '(default)';

const app = initializeApp({
  ...firebaseConfig,
  // Ensure we don't use a placeholder project ID
  projectId: (firebaseConfig.projectId && !firebaseConfig.projectId.includes('TODO')) ? firebaseConfig.projectId : undefined
});
export const auth = getAuth(app);

console.log(`[Firebase] Initializing Firestore with project: ${firebaseConfig.projectId}, database: ${dbId}`);

// Use initializeFirestore with experimentalForceLongPolling for better iframe compatibility
// We also disable auto-detect to avoid conflicts as requested.
// Adding host and ssl explicitly to ensure connectivity in restricted environments.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
  host: "firestore.googleapis.com",
  ssl: true,
}, dbId);
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

async function testConnection() {
  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`[Firebase] Testing Firestore connection (Attempt ${4 - retries}/3)...`);
      // Try to get a non-existent doc from server to test connection
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("[Firebase] Firestore connection test successful");
      return;
    } catch (error) {
      console.error(`[Firebase] Firestore connection test attempt ${4 - retries} failed:`, error);
      retries--;
      if (retries > 0) {
        console.log("[Firebase] Retrying in 2 seconds...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
          console.error("[Firebase] Firestore is unavailable. This may be due to a database ID mismatch, network restrictions, or iframe isolation.");
          console.error("[Firebase] Current Config:", { 
            projectId: firebaseConfig.projectId, 
            databaseId: dbId,
            forceLongPolling: true 
          });
        }
      }
    }
  }
}
testConnection();

export default app;
