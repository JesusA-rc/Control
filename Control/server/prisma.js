import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client.ts'

function databaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const user = encodeURIComponent(process.env.DB_USER || 'root')
  const password = encodeURIComponent(process.env.DB_PASSWORD || '')
  const host = process.env.DB_HOST || 'localhost'
  const port = process.env.DB_PORT || '3306'
  const database = process.env.DB_NAME || 'control'

  return `mysql://${user}:${password}@${host}:${port}/${database}`
}

const parsedDatabaseUrl = new URL(databaseUrl())
const adapter = new PrismaMariaDb({
  host: parsedDatabaseUrl.hostname,
  port: Number(parsedDatabaseUrl.port || 3306),
  user: decodeURIComponent(parsedDatabaseUrl.username),
  password: decodeURIComponent(parsedDatabaseUrl.password),
  database: parsedDatabaseUrl.pathname.replace(/^\//, ''),
  connectionLimit: 5,
})

export const prisma = new PrismaClient({ adapter })
