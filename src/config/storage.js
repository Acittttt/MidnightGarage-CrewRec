const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// When running on GCP (Cloud Run, App Engine), Application Default Credentials
// are used automatically. GOOGLE_APPLICATION_CREDENTIALS is only needed locally.
const storageOptions = { projectId: process.env.GCP_PROJECT_ID };
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const storage = new Storage(storageOptions);

// Lazily resolve the bucket so the app can start without GCS env vars.
// An error will only surface when an upload is actually attempted.
function getBucket() {
  const name = process.env.GCS_BUCKET_NAME;
  if (!name) {
    throw new Error('GCS_BUCKET_NAME environment variable is not set. Add it to your .env file.');
  }
  return storage.bucket(name);
}

module.exports = { storage, getBucket };
