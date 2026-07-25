import { defineConfig } from 'prisma/config'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

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

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl(),
  },
})
