import { client, db } from "./index";
import { sendDownloadedVideo } from "./util/downloadVideo";

async function handleUpload(uploadSnippet: any, guildId: any) {
    const results = await db.execute({ sql: `SELECT * FROM config WHERE guildId = ?`, args: [guildId]})
    const row: any = results.rows[0];

    const channel = client.channels.cache.get(row.alertChannelID);
    if (!channel?.isSendable()) return;

    const filterKeywords = row.filterKeywords.split(",");
    console.log(filterKeywords)
    for (const keyword of filterKeywords) {
        const trimmed = keyword.trim();
        //if (uploadSnippet.title.includes(trimmed) && row.filterType == 1) return;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${uploadSnippet.resourceId?.videoId}`

    console.log("Should have sent")
    await channel.send(`New video from **${row.channelUsername}**!\n${videoUrl}`);

    try {
        sendDownloadedVideo(client, channel.id, videoUrl)
    } catch (e) {
        console.log("Error downloading video!")
    }
}

export { handleUpload }