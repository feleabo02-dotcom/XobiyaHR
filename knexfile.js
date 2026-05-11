import 'dotenv/config';

const config = {
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
      extension: 'cjs',
      loadExtensions: ['.cjs'],
    },
    seeds: {
      directory: './server/seeds',
      extension: 'cjs',
      loadExtensions: ['.cjs'],
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
    migrations: {
      directory: './server/migrations',
      extension: 'cjs',
      loadExtensions: ['.cjs'],
    },
    seeds: {
      directory: './server/seeds',
      extension: 'cjs',
      loadExtensions: ['.cjs'],
    },
  },
};

export default config;
