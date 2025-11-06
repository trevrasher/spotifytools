"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="login-container">
      <header className="login-header"><span className="spotify-green">Spotify</span>Tools</header>
      <div>
      <button onClick={() => signIn("spotify", { callbackUrl: '/' })} className="btn btn-primary btn-lg">
        Login with Spotify
      </button>
      </div>
    </div>
  );
}