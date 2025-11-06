import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
    const { data: session } = useSession();
    
    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    return(
    <header className="title">
            <h1>
            <span className="spotify-green">Spotify</span>Tools
            </h1>
            <h2><Link href="/">Playlist Management</Link></h2>
            <h2><Link href="/youtube-converter">YouTube to Spotify</Link></h2>
            {session && (
                <button onClick={handleLogout} className="btn btn-primary logout-button">
                    Logout
                </button>
            )}
        </header>
    )
}