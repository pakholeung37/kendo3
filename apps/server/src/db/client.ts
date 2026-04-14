import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import { env } from '../env'

const databasePath = resolve(process.cwd(), env.databasePath)

mkdirSync(dirname(databasePath), { recursive: true })

export const sqlite = new Database(databasePath, { create: true })

sqlite.exec('PRAGMA journal_mode = WAL;')
sqlite.exec('PRAGMA synchronous = NORMAL;')
sqlite.exec('PRAGMA busy_timeout = 5000;')

export const db = drizzle(sqlite)
