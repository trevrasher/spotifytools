"use client"
import Header from "@/components/header"
import { useState } from "react"
import { fetchAllYouTubePlaylistVideos } from "../youtubeApi";
import { compareSpotifyYoutube } from "../openAIApi";
import { multiThreeSongSearch } from "../spotifyApi";
import { useSession } from "next-auth/react";
import { sToTrack } from "../openAIApi";


export default function youtubeConverter() {
    const [textInput, setNewTextInput] = useState<string>("");
    const { data: session, status } = useSession();
    const [simValues, setsimValues] = useState<sToTrack[]>();


    const handleSubmit = async (e:React.FormEvent) => {
        e.preventDefault();
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*[?&]list=([a-zA-Z0-9_-]+)/;
        if(youtubeRegex.test(textInput)) {
            const youtubeTitles = await fetchAllYouTubePlaylistVideos(textInput);
            const spotifyTrackSets = await multiThreeSongSearch(youtubeTitles, session?.accessToken)
            const sValues = await compareSpotifyYoutube(youtubeTitles, spotifyTrackSets)
            setsimValues(sValues);
        } else {
            alert("Please enter a valid YouTube playlist link.")
        }
    }

    return(
        <>
        <Header></Header>
        <form onSubmit={handleSubmit}>
            <input type="text" 
            value={textInput} 
            placeholder="Input a public YouTube playlist to convert..."
            onChange={(e) => setNewTextInput(e.target.value)} 
            className="playlist-input"></input>
        </form>
        <div>
            <table className = "converterTable">
                <thead>
                    <tr>
                        <th>YouTube Video</th>
                        <th>Matched Spotify Track</th>
                        <th>Artists</th>
                        <th>Similarity Score</th>
                    </tr>
                </thead>
                 <tbody>
                    {simValues?.map((item, index) => (
                        <tr key={index}>
                        <td>{item.youtubeTitle}</td>
                        <td>{item.track.name}</td>
                        <td>{item.track.artists.map(artist => artist.name).join(", ")}</td>
                        <td>{(item.similarity * 100).toFixed(1)}%</td>
                </tr>))}
                </tbody>
            </table>
        </div>
        </>
    )
}