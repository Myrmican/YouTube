import { youtube, youtube_v3 } from '@googleapis/youtube';

const youtubeClient = youtube({
  version: 'v3',
  auth: process.env.API_KEY,
});

// Helper: Convert Channel ID (UC...) to Uploads Playlist ID (UU...)
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
  private lastSeenVideoId: string | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: PollOptions) {
    this.uploadsPlaylistId = getUploadsPlaylistId(options.channelId);
    this.intervalMs = options.intervalMs ?? 60000; // Default: poll every 60s
    this.onNewVideo = options.onNewVideo;
  }

  public async start(): Promise<void> {
    // Perform an initial fetch to set the baseline video ID without firing the event
    this.lastSeenVideoId = await this.fetchLatestVideoId({ triggerEvent: false });

    // Start recurring poll loop
    this.timer = setInterval(async () => {
      try {
        await this.checkLatest();
      } catch (error) {
        console.error('Error polling YouTube API:', error);
      }
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async checkLatest(): Promise<void> {
    await this.fetchLatestVideoId({ triggerEvent: true });
  }

  private async fetchLatestVideoId(config: { triggerEvent: boolean }): Promise<string | null> {
    const response = await youtubeClient.playlistItems.list({
      playlistId: this.uploadsPlaylistId,
      part: ['snippet'],
      maxResults: 1,
    });

    const items = response.data.items;
    if (!items || items.length === 0) return null;

    const latestSnippet = items[0].snippet;
    const latestVideoId = latestSnippet?.resourceId?.videoId;

    if (!latestVideoId) return null;

    // Check if this video is newer than our baseline
    if (config.triggerEvent && this.lastSeenVideoId && latestVideoId !== this.lastSeenVideoId) {
      this.onNewVideo(latestSnippet);
    }

    this.lastSeenVideoId = latestVideoId;
    return latestVideoId;
  }
}

async function startPolling() {
  try {
    const response = await youtubeClient.channels.list({
      part: ['id', 'snippet'],
      forHandle: '@MongoTV' // Try with '@' included
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
            console.log('🎉 New Video Uploaded!');
            console.log(`Title: ${snippet.title}`);
            console.log(`URL: https://www.youtube.com/watch?v=${snippet.resourceId?.videoId}`);
            },
        });

        await poller.start();
    }
  } catch (error) {
    console.error('Error fetching channel details:', error);
  }
}

export { startPolling };