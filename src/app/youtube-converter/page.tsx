"use client"
import Header from "@/components/header"
import { useState } from "react"
import { fetchAllYouTubePlaylistVideos } from "../youtubeApi";
import { compareSpotifyYoutube } from "../openAIApi";
import { multiThreeSongSearch, SpotifyTrack } from "../spotifyApi";
import { useSession } from "next-auth/react";
import { sToTrack } from "../openAIApi";
import { createNewPlaylist, addToPlaylist} from "../spotifyApi";


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
            console.log(sValues);
            setNewTextInput("");
        } else {
            alert("Please enter a valid YouTube playlist link.")
        }
    }

    const handleSubmitButton = async () => {
        const submitURI = simValues?.filter(item => item.confirmed).map(item=> item.track.uri) || [];
        const playlistID = await createNewPlaylist(session?.accessToken, "Youtube Conversion");
        addToPlaylist(session?.accessToken, submitURI, playlistID);
    }

    const handleCheckboxChange = (index: number) => {
        if(!simValues) return;
        let updatedSimValues = [...simValues];
        updatedSimValues[index].confirmed = !updatedSimValues[index].confirmed;
        setsimValues(updatedSimValues);
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
                        <th>Confirm</th>
                        <th>YouTube Video</th>
                        <th>Matched Spotify Track</th>
                        <th>Artists</th>
                        <th>Similarity Score</th>
                    </tr>
                </thead>
                 <tbody>
                    {simValues?.map((item, index) => (
                        <tr key={index} className={!item.confirmed ? "low-similarity" : ''}>
                        <td>
                            <input type="checkbox" checked={item.confirmed} onChange={() => handleCheckboxChange(index)}/>
                        </td>
                        <td>{item.youtubeTitle}</td>
                        <td>{item.track.name}</td>
                        <td>{item.track.artists.map(artist => artist.name).join(", ")}</td>
                        <td>{(item.similarity * 100).toFixed(1)}%</td>
                </tr>))}
                </tbody>
            </table>
            <button onClick={handleSubmitButton}>Submit Playlist</button>

        </div>
        </>
    )
}