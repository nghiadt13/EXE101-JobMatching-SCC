require('dotenv').config({path: '.env'});
const { Pool } = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query('TRUNCATE TABLE "RagKnowledge"').then(() => {
  console.log('Truncated');
  process.exit(0);
}).catch(console.error);
