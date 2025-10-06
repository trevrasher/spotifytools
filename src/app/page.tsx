"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchLikedSongs, artistFilter, SpotifyTrackItem, filteredArtist, multiplePlaylistCreation} from "./spotifyApi";

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
    if (playlistName.trim() && !playlistArray.some(p => p.playlistName === playlistName.trim())) {
      setPlaylistArray(prev => [
        ...prev,
        { playlistName: playlistName, artists: [] }
      ]);
      setNewPlaylist('');
    }
  };

  return (
    <>
      <header className="title">
        <h1>
          <span className="spotify-green">Spotify</span>Tools
        </h1>
        <h2>Playlist Management</h2>
        <h2>YouTube to Spotify</h2>
      </header>
      <div className="main-content">
{/* LIST OF ARTISTS */}
        <ol>
          {likedSongs &&
            Object.entries(artistFilter(likedSongs)).sort((a, b) => b[1].count - a[1].count).map(([_, info]) => (
                <div className={`artist-listing${selectedArtist?.artistName === info.artistName ? " selected-artist" : ""}${placedArtists.some(a => a.artistName === info.artistName) ? " crossed-artist" : ""}`} key={info.artistName} onClick={() => setSelectedArtist(info)}>
                  {info.artistName}: {info.count}
                </div>
              ))}
        </ol>
{/* PLAYLIST */}
        <div className="playlist-container">
          <form onSubmit={handleSubmit} className="template-form">
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
          <button className = "submitPlaylistButton" onClick={() =>multiplePlaylistCreation(session?.accessToken, playlistArray)}> submit playlist button </button>
        </div>
      </div>
    </>
  );
}