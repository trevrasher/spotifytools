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

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [likedSongs, setLikedSongs] = useState<SpotifyTrackItem[] | null | undefined>(null);
  const [playlistName, setNewPlaylist] = useState('');
  const [playlistArray, setPlaylistArray] = useState<Playlist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<filteredArtist | null>(null);
  const [placedArtists, setPlacedArtists] = useState<filteredArtist[]>([]);
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
                    setPlaylistArray(prev =>
                      prev.map((playlist, i) =>
                        i === idx && !playlist.artists.some(a => a.artistName === selectedArtist.artistName)? { ...playlist, artists: [...playlist.artists, selectedArtist] }: playlist
                      )
                    );
                    setSelectedArtist(null);
                    setPlacedArtists(prev =>
                      prev.includes(selectedArtist) ? prev : [...prev, selectedArtist]
                    );
                  }
                }}
              >
                <span className="playlist-text">{playlistName}</span>
                <button
                  className="delete-button"
                  onClick={() => {
                    setPlaylistArray(prev =>
                      prev.filter((_, i) => i !== idx)
                    );
                  }}
                >
                  X
                </button>
                {artists.map((artist, idx) => (
                  <div key={artist.artistName + idx} className="artist-in-playlist">
                    {artist.artistName}
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