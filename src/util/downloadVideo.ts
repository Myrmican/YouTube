import { Client, User } from 'discord.js';
import ytdlp from 'yt-dlp-exec';
import fetch from 'node-fetch';
import FormData from 'form-data';
import * as path from 'path';
import * as fs from 'fs';

async function downloadVideo(youtubeUrl: string, outputFilename: string): Promise<string> {
    const outputPath = path.join(__dirname, outputFilename);

    const flags = {
        output: outputPath,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
        cookiesFromBrowser: 'chrome',
        jsRuntimes: 'node',
    };

    await ytdlp(youtubeUrl, flags);

    return outputPath;
}

async function uploadToCatbox(filePath: string): Promise<string> {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form,
    });

    const directUrl = await response.text();
    return directUrl.trim();
}

async function sendDownloadedVideo(client: Client, userId: string, videoUrl: string): Promise<void> {
    const tempFileName = `video_${Date.now()}.mp4`;
    let downloadedFilePath: string | null = null;

    try {
        const user: User = await client.users.fetch(userId);
        downloadedFilePath = await downloadVideo(videoUrl, tempFileName);

        const fileUrl = await uploadToCatbox(downloadedFilePath);

        await user.send({
            content: `🎥 **New YouTube Video:**\n${fileUrl}`,
        });
    } catch (error) {
        console.error('Failed to process or send video to DM:', error);
    } finally {
        if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
            fs.unlinkSync(downloadedFilePath);
        }
    }
}

export { sendDownloadedVideo };