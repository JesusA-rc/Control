import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(currentDir, '../.env') })

function databaseConfig() {
  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl) {
    const parsedUrl = new URL(databaseUrl)

    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port || 3306),
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.replace(/^\//, ''),
    }
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'control',
  }
}

function escapeIdentifier(identifier) {
  return `\`${identifier.replaceAll('`', '``')}\``
}

const config = databaseConfig()
const connection = await mysql.createConnection({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
})

await connection.query(
  `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(config.database)}
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci`,
)
await connection.end()

console.log(`Base de datos lista: ${config.database}`)
