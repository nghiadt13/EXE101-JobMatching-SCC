const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: 'apps/api/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Extension pgvector created successfully!');
  } catch (err) {
    console.error('Error creating extension:', err.message);
  } finally {
    await client.end();
  }
}

run();
