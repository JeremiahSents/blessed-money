import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './db/schema'

const client = postgres(process.env.DATABASE_URL!, {
    prepare: false
})

const db = drizzle(client, { schema })

export default db