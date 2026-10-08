import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

export const sql = neon(databaseUrl)
