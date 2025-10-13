import Link from "next/link";

export default function Header() {
    return(
    <header className="title">
            <h1>
            <span className="spotify-green">Spotify</span>Tools
            </h1>
            <h2><Link href="/">Playlist Management</Link></h2>
            <h2><Link href="/youtube-converter">YouTube to Spotify</Link></h2>
        </header>
    )
}