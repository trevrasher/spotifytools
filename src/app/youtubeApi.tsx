"use server"
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export interface YouTubePlaylistSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    [key: string]: {
      url: string;
      width: number;
      height: number;
    };
  };
  channelTitle: string;
  playlistId: string;
  position: number;
  resourceId: {
    kind: string;
    videoId: string;
  };
}

export interface YouTubePlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubePlaylistSnippet;
}

export interface YouTubePlaylistResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubePlaylistItem[];
}



export async function fetchAllYouTubePlaylistVideos(playlistLink: string): Promise<string[]> {
    const playlistId = extractPlaylistId(playlistLink);
    let nextPageToken: string | undefined = undefined;
    let videos: string[] = [];
    do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.json();
      console.error("YouTube API error: (fetchAllYoutubePlaylistVideos)", error);
      break;
    }
    const data: YouTubePlaylistResponse = await res.json();
    const titles = data.items.map(item => sanitizeToUTF8(item.snippet.title));    
    videos.push(...titles);
    nextPageToken = data.nextPageToken;
    } while(nextPageToken);
    return videos;
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}


function sanitizeToUTF8(title: string): string {
  let cleanTitle = title
    .replace(/[\u3000-\u303f]/g, '') 
    .replace(/\|/g, '') 
    .replace(/\s+/g, ' ') 
    .trim(); 
  return cleanTitle;
}
