const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Tanpa keyFilename, library ini bakal otomatis nyari kredensial 
// dari 'gcloud auth application-default login' yang lo jalanin di terminal.
const storageOptions = {
  projectId: process.env.GCP_PROJECT_ID
};

const storage = new Storage(storageOptions);

function getBucket() {
  const name = process.env.GCS_BUCKET_NAME;
  if (!name) {
    throw new Error('GCS_BUCKET_NAME belum di-set di .env');
  }
  return storage.bucket(name);
}

module.exports = { storage, getBucket };