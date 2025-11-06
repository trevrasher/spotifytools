"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchLikedSongs, SpotifyTrackItem, filteredArtist, multiplePlaylistCreation} from "../lib/spotifyApi";
import { artistFilter } from "./utils/spotifyUtils";
import Header from "@/components/header";
import ErrorPopup from "@/components/errorPopup";

export interface Playlist {
  playlistName: string;
  artists: filteredArtist[];
}

interface placedArtistCount {
  artistName: string;
  count: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [likedSongs, setLikedSongs] = useState<SpotifyTrackItem[] | null | undefined>(null);
  const [playlistName, setNewPlaylist] = useState('');
  const [playlistArray, setPlaylistArray] = useState<Playlist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<filteredArtist | null>(null);
  const [placedArtists, setPlacedArtists] = useState<placedArtistCount[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const MAX_PLAYLISTS = 10;
  const CACHE_KEY = 'spotifyLikedSongs';
  

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Cache liked songs
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const cachedSongs = sessionStorage.getItem(CACHE_KEY);
    if (cachedSongs) {
      setLikedSongs(JSON.parse(cachedSongs));
    } else {
      fetchLikedSongs(session?.accessToken).then(data => {
        setLikedSongs(data);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      });
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (playlistArray.length >= MAX_PLAYLISTS) {
      setNewPlaylist("");
      setError(`You cannot create more than ${MAX_PLAYLISTS} playlists.`);
      return;
    }

    if (!playlistName.trim()) {
      setError("Please enter a playlist name.");
      return;
    }

    if (playlistArray.some(p => p.playlistName === playlistName.trim())) {
      setError("You cannot enter duplicate playlist names.");
      return; 
    }

    setPlaylistArray(prev => [
      ...prev,
      { playlistName: playlistName.trim(), artists: [] }
    ]);
    setNewPlaylist('');
  };

  const removeArtistFromPlaylist = (playlistIdx: number, artistIdx: number, artistName: string) => {
    setPlaylistArray(prev => prev.map((playlist, i) => 
        i === playlistIdx 
          ? { ...playlist, artists: playlist.artists.filter((_, j) => j !== artistIdx) }
          : playlist
      )
    );
    
    setPlacedArtists(prev => 
      prev.map(placedArtist => 
        placedArtist.artistName === artistName
          ? { ...placedArtist, count: Math.max(0, placedArtist.count - 1) }
          : placedArtist
      ).filter(artist => artist.count > 0) 
    );
  };

    const incrementArtistCount = (artistName: string) => {
    setPlacedArtists(prev => {
      const existingArtist = prev.find(a => a.artistName === artistName);
      if (existingArtist) {
        return prev.map(a => 
          a.artistName === artistName 
            ? { ...a, count: a.count + 1 }
            : a
        );
      }
      return [...prev, { artistName, count: 1 }];
    });
  };

  const addArtistToPlaylist = (playlistIdx: number) => {
    if (!selectedArtist) return;
    
    const isDuplicate = playlistArray[playlistIdx].artists.some(
      a => a.artistName === selectedArtist.artistName
    );
    if (isDuplicate) return;
    
    setPlaylistArray(prev =>
      prev.map((playlist, i) =>
        i === playlistIdx 
          ? { ...playlist, artists: [...playlist.artists, selectedArtist] } 
          : playlist
      )
    );
    
    incrementArtistCount(selectedArtist.artistName);
    setSelectedArtist(null);
  };

  const deletePlaylist = (idx: number) => {
    const playlistToDelete = playlistArray[idx];
    
    setPlacedArtists(prev => 
      prev.map(placedArtist => {
        const timesInDeletedPlaylist = playlistToDelete.artists.filter(
          artist => artist.artistName === placedArtist.artistName
        ).length;
        
        return {
          ...placedArtist,
          count: Math.max(0, placedArtist.count - timesInDeletedPlaylist)
        };
      }).filter(artist => artist.count > 0)
    );
    
    setPlaylistArray(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      <Header />
      <div className="main-content">
{/* LIST OF ARTISTS */}
        <div className="artist-grid">
          {likedSongs &&
            Object.entries(artistFilter(likedSongs)).sort((a, b) => b[1].count - a[1].count).map(([_, info]) => (
                <div className={`artist-listing${selectedArtist?.artistName === info.artistName ? " selected-artist" : ""}${placedArtists.some(a => a.artistName === info.artistName) ? " crossed-artist" : ""}`} key={info.artistName} onClick={() => setSelectedArtist(info)}>
                  {info.artistName}: {info.count}
                </div>
              ))}
        </div>
{/* PLAYLIST */}
        <div className="playlist-container">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setNewPlaylist(e.target.value)}
              placeholder="Add new playlist..."
              className="playlist-input"
            />
          </form>
          <div>
            {playlistArray.map(({ playlistName, artists }, idx) => (
              <div
                className="playlist"
                key={playlistName + idx}
                onClick={() => addArtistToPlaylist(idx)}
              >
                <div className="playlist-header">
                  <span className="playlist-text">{playlistName}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist(idx);
                    }}
                  >
                    X
                  </button>
                </div>
                {artists.map((artist, artistIdx) => (
                  <div key={artist.artistName + artistIdx} className="playlist-artist">
                    <button onClick={!selectedArtist? (e) => {
                        e.stopPropagation();
                        removeArtistFromPlaylist(idx, artistIdx, artist.artistName);
                      }:undefined} className="playlist-artist-button">
                        {artist.artistName}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
            <div className="converter-button-container">
             {placedArtists.length>=1 && ( <button className="btn btn-primary btn-lg" onClick={() =>multiplePlaylistCreation(session?.accessToken, playlistArray)}> Submit Playlists </button>)}
            </div>
        </div>
      </div>
      <ErrorPopup errorText={error} onClear={() => setError(null)} />
    </>
  );
}