import { Client, AttachmentBuilder, TextChannel, User } from 'discord.js';
import ytdlp from 'yt-dlp-exec';
import ffmpegPath from 'ffmpeg-static';
import * as path from 'path';
import * as fs from 'fs';

async function downloadVideo(youtubeUrl: string, outputFilename: string): Promise<string> {
    const outputPath = path.join(__dirname, outputFilename);

    await ytdlp(youtubeUrl, {
        output: outputPath,
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
        maxFilesize: '50M',
        });

    return outputPath;
}

async function sendDownloadedVideo(client: Client, userId: string, videoUrl: string): Promise<void> {
    const tempFileName = `video_${Date.now()}.mp4`;
    let downloadedFilePath: string | null = null;

    try {
        const user: User = await client.users.fetch(userId);
        downloadedFilePath = await downloadVideo(videoUrl, tempFileName);

        const attachment = new AttachmentBuilder(downloadedFilePath);
    await user.send({
        content: '🎥 **New YouTube Upload Downloaded:**',
        files: [attachment],
    });
    } catch (error) {
        console.error('Failed to process or send video to DM:', error);
    } finally {
        if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
            fs.unlinkSync(downloadedFilePath);
    }
    }
}

export { sendDownloadedVideo }