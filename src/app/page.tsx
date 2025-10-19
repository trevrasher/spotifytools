"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchLikedSongs, SpotifyTrackItem, filteredArtist, multiplePlaylistCreation} from "./spotifyApi";
import { artistFilter } from "./utils/spotifyUtils";
import Header from "@/components/header";

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
  const [isFadingOut, setIsFadingOut] = useState(false);

useEffect(() => {
  if (error) {
    setIsFadingOut(false); 
    
    const timer = setTimeout(() => {
      setIsFadingOut(true); 
      setTimeout(() => {
        setError(null);
        setIsFadingOut(false);
      }, 500); 
    }, 3500); 

    return () => clearTimeout(timer);
  }
}, [error]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("../login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchLikedSongs(session?.accessToken).then(data => {
        setLikedSongs(data);
      });
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); 
    
    if(playlistArray.length >= 2) {
      setNewPlaylist("");
      setError("You cannot create more than 10 playlists.");
      return;
    }
    
    if (playlistName.trim() && !playlistArray.some(p => p.playlistName === playlistName.trim())) {
      setPlaylistArray(prev => [
        ...prev,
        { playlistName: playlistName, artists: [] }
      ]);
      setNewPlaylist('');
    } else if (!playlistName.trim()) {
      setError("Please enter a playlist name.");
    }
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

  return (
    <>
      <Header></Header>
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
                onClick={() => {
                  if (selectedArtist) {
                    if(!playlistArray[idx].artists.some(a => a.artistName === selectedArtist.artistName)) {
                      setPlaylistArray(prev =>
                        prev.map((playlist, i) =>
                          i === idx ? { ...playlist, artists: [...playlist.artists, selectedArtist] } : playlist
                        )
                      );
                      
                      setPlacedArtists(prev => {
                        const existingArtist = prev.find(a => a.artistName === selectedArtist.artistName);
                        if (existingArtist) {
                          return prev.map(a => 
                            a.artistName === selectedArtist.artistName 
                              ? { ...a, count: a.count + 1 }
                              : a
                          );
                        } else {
                          return [...prev, { artistName: selectedArtist.artistName, count: 1 }];
                        }
                      });
                    }
                    setSelectedArtist(null);
                  }
                }}
              >
                <div className="playlist-header">
                  <span className="playlist-text">{playlistName}</span>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation(); 
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
                      
                      setPlaylistArray(prev =>
                        prev.filter((_, i) => i !== idx)
                      );
                    }}
                  >
                    X
                  </button>
                </div>
                {artists.map((artist, artistIdx) => (
                  <div key={artist.artistName + artistIdx} className="playlist-artist">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        removeArtistFromPlaylist(idx, artistIdx, artist.artistName);
                      }} className="playlist-artist-button">
                        {artist.artistName}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
            <div className="converter-button-container">
             {placedArtists.length>=1 && ( <button className = "converter-submit-button" onClick={() =>multiplePlaylistCreation(session?.accessToken, playlistArray)}> Submit Playlists </button>)}
            </div>
        </div>
      </div>
      {error && (
        <div className={`error ${isFadingOut ? 'fade-out' : ''}`}>
          {error}
        </div>
      )}
    </>
  );
}