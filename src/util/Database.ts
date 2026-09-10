import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN!,
});

(async () => {
    await db.execute({
        sql: `
        CREATE TABLE IF NOT EXISTS config (
        channelUsername TEXT NOT NULL,
        filterType INT,
        alertChannelID TEXT,
        filterKeywords TEXT
        );`
})
})()

export { db }