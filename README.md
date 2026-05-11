# XobiyaHR

XobiyaHR is an ERP workspace for managing HR operations and the modules that connect to it, including finance, PSA, procurement, CRM, and manufacturing flows.

## Prerequisites

- Node.js 18 or newer
- MySQL 8 or compatible database
- npm

## Setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create your local environment file.

   Copy [.env.example](.env.example) to [.env](.env) and update the values for your machine.

3. Configure the database connection.

   Make sure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` point to a reachable MySQL instance.

4. Initialize the database.

   ```bash
   npm run db:setup
   ```

   This runs the Knex migrations and seeds the database.

## Run the app

Start the frontend and backend in separate terminals.

```bash
npm run dev
```

```bash
npm run server:dev
```

The frontend runs on `http://localhost:3000` and the API runs on `http://localhost:4000` by default.

## Useful scripts

- `npm run dev` - start the Vite frontend
- `npm run server` - start the API server
- `npm run server:dev` - start the API server with watch mode
- `npm run build` - build the frontend for production
- `npm run lint` - run the TypeScript type check
- `npm run db:migrate` - run pending migrations
- `npm run db:rollback` - roll back the latest migration
- `npm run db:seed` - run seed scripts
- `npm run db:reset` - reset the database and reapply migrations/seeds

## Environment variables

| Variable | Description |
| --- | --- |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `PORT` | API port |
| `CLIENT_URL` | Allowed frontend origin |
| `VITE_API_URL` | Frontend API base URL |

## Project structure

- `src/` - React frontend
- `server/` - Express API, routes, migrations, and seeds
- `knexfile.js` - Knex database configuration

## Quick check

After setup, open the frontend and verify the dashboard loads. If the API is configured correctly, the app will fetch data from the local backend and database.
