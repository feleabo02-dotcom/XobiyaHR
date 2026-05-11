const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || 'xobiya_hr';
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`Database '${dbName}' created or already exists.`);
  await conn.end();
}

createDatabase().catch((err) => {
  console.error('Failed to create database:', err.message);
  process.exit(1);
});
