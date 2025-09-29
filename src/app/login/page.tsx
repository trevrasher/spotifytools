"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <button onClick={() => signIn("spotify")}>
      Login with Spotify
    </button>
  );
}