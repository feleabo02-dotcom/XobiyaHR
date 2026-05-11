import 'dotenv/config';

export default {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'xobiya_hr',
    },
    migrations: {
      directory: './server/migrations',
      extension: 'js',
    },
    seeds: {
      directory: './server/seeds',
      extension: 'js',
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: './server/migrations' },
    seeds: { directory: './server/seeds' },
  },
};
