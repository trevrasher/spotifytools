"use client"
import { useRouter } from "next/navigation";
import { useEffect } from 'react';
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("../login");
    }
  }, [status, router]);


  return (
    <header className="title">
      <h1 ><span className="spotify-green">Spotify</span>Tools</h1>
        <h2>Playlist Management</h2>
        <h2>YouTube to Spotify</h2>
    </header>
  );
}