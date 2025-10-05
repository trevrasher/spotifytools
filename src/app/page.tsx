"use client"
import { useRouter } from "next/navigation";
import { useEffect } from 'react';
import { useState } from "react";
import { useSession } from "next-auth/react";
import { fetchLikedSongs, artistFilter, SpotifyTrackItem} from "./spotifyApi";

interface ArtistPlaylist {
  playlistName:string;
  artists:string[];

}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [likedSongs, setLikedSongs] = useState<SpotifyTrackItem[]| null | undefined> (null);
  const [newPlaylist, setNewPlaylist] =useState('');
  const [playlistArray, setPlaylistArray] = useState<ArtistPlaylist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [placedArtists, setPlacedArtists] = useState<string[]>([]);

    useEffect(() => {
    if (status === "loading") return; 
    if (status === "unauthenticated") {
      router.push("../login");
    }
  }, [status, router]);

    useEffect(() => {
      if (status === "authenticated"){
        fetchLikedSongs(session?.accessToken).then(data => {
            setLikedSongs(data);
          });
        }
    }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylist.trim()) {
      setPlaylistArray(prev => [...prev, { playlistName: newPlaylist, artists: [] }]);
      setNewPlaylist('');
    }
  }

    
  return (
    <>
      <header className="title">
        <h1 ><span className="spotify-green">Spotify</span>Tools</h1>
          <h2>Playlist Management</h2>
          <h2>YouTube to Spotify</h2>
      </header>
      <div className="main-content">
        <div>
          {likedSongs && Object.entries(artistFilter(likedSongs))
          .sort((a, b) => b[1].count - a[1].count)
          .map(([artist, info]) => (
              <div className={`artist-listing${selectedArtist === artist ? " selected-artist" : ""}${placedArtists.includes(artist) ? " crossed-out" : ""}`} key={artist} onClick={() => setSelectedArtist(artist)}>
                {artist}: {info.count}
                </div>
            ))
          }
        </div>
          <div className="playlist-container">
            <form onSubmit={handleSubmit} className="template-form">
              <input 
              type="text"
              value={newPlaylist}
              onChange={(e) => setNewPlaylist(e.target.value)}
              placeholder="Add new playlist..."
              className="playlist-input"
              >
              </input>
            </form>
            <div>
             {playlistArray.map(({ playlistName, artists }, idx) => (
            <div className="playlist"
              key={playlistName + idx}
              onClick={() => {
                if (selectedArtist) {
                  setPlaylistArray(prev =>
                    prev.map((playlist, i) =>
                      i === idx && !playlist.artists.includes(selectedArtist)
                        ? { ...playlist, artists: [...playlist.artists, selectedArtist] }
                        : playlist
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
                  <button className="delete-button"
                    onClick={() => {
                      setPlaylistArray(prev =>
                        prev.filter((_, i) => i !== idx)
                      );
                    }}>X
                  </button>
                  {artists.map((artist, idx) => (
                    <div key={artist+idx} className="artist-in-playlist">{artist}</div>
                  ))}
                </div>
              ))}           
            </div>
          </div>
        </div>
    </>
  );
}