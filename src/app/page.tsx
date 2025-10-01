"use client"
import { useRouter } from "next/navigation";
import { useEffect } from 'react';
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { fetchLikedSongs, artistFilter, SpotifyTrackItem} from "./spotifyApi";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [likedSongs, setLikedSongs] = useState<SpotifyTrackItem[]| null | undefined> (null);

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


  return (
    <>
      <header className="title">
        <h1 ><span className="spotify-green">Spotify</span>Tools</h1>
          <h2>Playlist Management</h2>
          <h2>YouTube to Spotify</h2>
      </header>
        <div>
          {likedSongs && Object.entries(artistFilter(likedSongs))
          .sort((a, b) => b[1].count - a[1].count)
          .map(([artist, info]) => (
              <div key={artist} className="artist-listing">
                {artist}: {info.count}
                </div>
            ))
          }
        </div>
    </>
  );
}