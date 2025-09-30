import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.NEXT_PUBLIC_PGHOST,
  user: process.env.NEXT_PUBLIC_PGUSER,
  password: process.env.NEXT_PUBLIC_PGPASSWORD,
  port: process.env.NEXT_PUBLIC_PGPORT,
  database: process.env.NEXT_PUBLIC_PGDATABASE,
});
