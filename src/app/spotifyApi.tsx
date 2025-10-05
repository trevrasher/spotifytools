import { Playlist } from "./page";

export interface SpotifyArtist {
  external_urls: { spotify: string };
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface SpotifyAlbumImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyAlbum {
  album_type: string;
  total_tracks: number;
  available_markets: string[];
  external_urls: { spotify: string };
  href: string;
  id: string;
  images: SpotifyAlbumImage[];
  name: string;
  release_date: string;
  release_date_precision: string;
  restrictions?: { reason: string };
  type: string;
  uri: string;
  artists: SpotifyArtist[];
}

export interface SpotifyExternalIds {
  isrc: string;
  ean: string;
  upc: string;
}

export interface SpotifyTrack {
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: SpotifyExternalIds;
  external_urls: { spotify: string };
  href: string;
  id: string;
  is_playable: boolean;
  linked_from?: object;
  restrictions?: { reason: string };
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
  is_local: boolean;
}

export interface SpotifyTrackItem {
  added_at: string;
  track: SpotifyTrack;
}

export interface SpotifyTracksResponse {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: SpotifyTrackItem[];
}

export interface filteredArtist {
  artistName:string;
  count: number;
  image: string;
  trackIDs: SpotifyTrackItem[];
}



export async function fetchLikedSongs(accessToken: string | undefined): Promise<SpotifyTrackItem[] | null> {
    const limit = 50;
    const firstRes = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=0`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!firstRes.ok) {
        const error = await firstRes.json();
        console.error("Spotify API error:", error);
        return null;
    }
    const firstData = await firstRes.json() as SpotifyTracksResponse;
    const allTracks: SpotifyTrackItem[] = [...firstData.items];

    const total = firstData.total;
    const numPages = Math.ceil(total / limit);

    const fetches: Promise<Response>[] = [];
    for (let i = 1; i < numPages; i++) {
        const offset = i * limit;
        fetches.push(fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
        );
    }

    const responses = await Promise.all(fetches);
    for (const res of responses) {
        if (!res.ok) {
            const error = await res.json();
            console.error("Spotify API error:", error);
            continue;
        }
        const data = await res.json() as SpotifyTracksResponse;
        allTracks.push(...data.items);
    }
    return allTracks;
}

export function artistFilter(data: SpotifyTrackItem[]) {
    const artists: { [name: string]: filteredArtist } = {};
    data.forEach((trackItem: SpotifyTrackItem) => {
        const artist = trackItem.track.artists[0];
        const name = artist.name;
        if (!artists[name]) {
            artists[name] = {
                artistName: name,
                count: 1,
                image: trackItem.track.album.images[0]?.url || "",
                trackIDs: [trackItem]
            };
        } else {
            artists[name].count += 1;
            artists[name].trackIDs.push(trackItem);
        }
    });
    return Object.values(artists);
}

export function playlistUpload(playlist: Playlist) {
  
}