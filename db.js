const Pool = require("pg").Pool;
require("dotenv").config();

const dbURLForDev = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`
console.log(dbURLForDev)
// postgresql://dba:test123@localhost:5432/jwt_database

const dbURLForProd = process.env.DATABASE_URL //heroku addons

const pool = new Pool({
  connectionString: process.env.NODE_ENV === "production" ? dbURLForProd : dbURLForDev
});

module.exports = pool;