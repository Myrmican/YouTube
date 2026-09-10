import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN!,
});

(async () => {
    await db.execute({
        sql: `
        CREATE TABLE IF NOT EXISTS config (
        guildId TEXT PRIMARY KEY,
        channelUsername TEXT DEFAULT '',
        filterType INT DEFAULT 1,
        alertChannelID TEXT DEFAULT '0',
        filterKeywords TEXT DEFAULT ''
        );`
})
})()

export { db }