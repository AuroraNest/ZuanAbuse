import mysql from 'mysql2/promise'
import { createError, defineEventHandler, getQuery } from 'h3'
import { useRuntimeConfig } from '#imports'

let pool: mysql.Pool | null = null

const allowedLevels = new Set(['min', 'max', 'all'])

function getPool() {
  if (pool) return pool
  const config = useRuntimeConfig()
  pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    connectionLimit: 8
  })
  return pool
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const level = typeof query.level === 'string' ? query.level : 'all'

  if (!allowedLevels.has(level)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid level' })
  }

  const sql =
    level === 'all'
      ? 'SELECT id, `text`, `level` FROM `zuan` ORDER BY RAND() LIMIT 1'
      : 'SELECT id, `text`, `level` FROM `zuan` WHERE `level` = ? ORDER BY RAND() LIMIT 1'

  const pool = getPool()
  const [rows] = await pool.query(sql, level === 'all' ? [] : [level])
  const list = Array.isArray(rows) ? rows : []
  const row = list[0] as { id: number; text: string; level: string } | undefined

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'empty' })
  }

  return row
})
