import { client, db } from "./index";

async function handleUpload(uploadSnippet: any, guildId: any) {
    const results = await db.execute({ sql: `SELECT * FROM config WHERE guildId = ?`, args: [guildId]})
    const row: any = results.rows[0];

    const channel = client.channels.cache.get(row.alertChannelID);
    console.log(channel);
    if (!channel?.isSendable()) return;

    const filterKeywords = row.filterKeywords.split(",");
    for (const keyword of filterKeywords) {
        console.log(keyword)
        if (uploadSnippet.title.includes(keyword) && row.filterType == 1) return;
    }

    await channel.send(`New video from **${row.channelUsername}**!\nhttps://www.youtube.com/watch?v=${uploadSnippet.resourceId?.videoId}`);
}

export { handleUpload }