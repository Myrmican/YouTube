import { youtube, youtube_v3 } from '@googleapis/youtube';
import { handleUpload } from './uploadedVideo';
import { db } from "./index";

const youtubeClient = youtube({
    version: 'v3',
    auth: process.env.API_KEY,
});

function getUploadsPlaylistId(channelId: string): string {
    if (channelId.startsWith('UC')) {
        return 'UU' + channelId.substring(2);
    }
    return channelId;
}

interface PollOptions {
    channelId: string;
    intervalMs?: number;
    onNewVideo: (video: youtube_v3.Schema$PlaylistItemSnippet) => void;
}

export class YouTubeUploadPoller {
    private uploadsPlaylistId: string;
    private intervalMs: number;
    private onNewVideo: (video: youtube_v3.Schema$PlaylistItemSnippet) => void;
    private knownVideoIds: Set<string> = new Set();
    private timer: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    constructor(options: PollOptions) {
    this.uploadsPlaylistId = getUploadsPlaylistId(options.channelId);
    this.intervalMs = options.intervalMs ?? 60000;
    this.onNewVideo = options.onNewVideo;
}

public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    await this.seedInitialState();

    this.scheduleNextPoll();
}

public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
}

private async seedInitialState(): Promise<void> {
    try {
        const recentItems = await this.fetchRecentUploads(5);
        for (const item of recentItems) {
        const videoId = item.snippet?.resourceId?.videoId;
        if (videoId) {
            this.knownVideoIds.add(videoId);
        }
        }
    } catch (error) {
        console.error('Error establishing baseline uploads:', error);
    }
}

private scheduleNextPoll(): void {
    if (!this.isRunning) return;

    this.timer = setTimeout(async () => {
        try {
        await this.poll();
        } catch (error) {
        console.error('Error polling YouTube API:', error);
        } finally {
        this.scheduleNextPoll();
        }
    }, this.intervalMs);
  }

  private async poll(): Promise<void> {
    const recentItems = await this.fetchRecentUploads(5);
    const reversedItems = [...recentItems].reverse();

    for (const item of reversedItems) {
        const videoId = item.snippet?.resourceId?.videoId;
        if (!videoId || !item.snippet) continue;

        if (!this.knownVideoIds.has(videoId)) {
            this.knownVideoIds.add(videoId);
            this.onNewVideo(item.snippet);
        }
    }
  }

  private async fetchRecentUploads(maxResults: number): Promise<youtube_v3.Schema$PlaylistItem[]> {
    const response = await youtubeClient.playlistItems.list({
      playlistId: this.uploadsPlaylistId,
      part: ['snippet'],
      maxResults,
    });

    return response.data.items ?? [];
  }
}

async function startPolling(guildId: any) {
    try {
        const results = await db.execute({ sql: `SELECT * FROM config WHERE guildId = ?`, args: [guildId]})
        const row: any = results.rows[0];

        const response = await youtubeClient.channels.list({
            part: ['id', 'snippet'],
            forHandle: '@' + row.channelUsername,
        });

        if (!response.data.items || response.data.items.length === 0) {
            console.log('No channel found for that handle.');
            return;
        }

        const channelId = response.data.items[0].id;

        if (channelId) {
            const poller = new YouTubeUploadPoller({
            channelId: channelId,
            intervalMs: 120000,
            onNewVideo: (snippet) => {
                handleUpload(snippet, guildId)
            },
            });

            await poller.start();
        }
    } catch (error) {
        console.error('Error fetching channel details:', error);
    }
}

export { startPolling };