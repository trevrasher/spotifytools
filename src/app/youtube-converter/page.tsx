"use client"
import Header from "@/components/header"
import { useState } from "react"
import { fetchAllYouTubePlaylistVideos } from "../youtubeApi";
import { compareSpotifyYoutube } from "../openAIApi";
import { multiThreeSongSearch } from "../spotifyApi";
import { useSession } from "next-auth/react";
import { sToTrack } from "../openAIApi";
import { createNewPlaylist, addToPlaylist} from "../spotifyApi";


export default function YoutubeConverter() {
    const [textInput, setNewTextInput] = useState<string>("");
    const { data: session, status } = useSession();
    const [simValues, setsimValues] = useState<sToTrack[]>();
    const [loading, setLoading] = useState<boolean>(false);


    const handleSubmit = async (e:React.FormEvent) => {
        e.preventDefault();
        setNewTextInput("");
        setLoading(true);

        try {
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*[?&]list=([a-zA-Z0-9_-]+)/;
            if(!youtubeRegex.test(textInput)) {
                throw new Error("Please enter a valid YouTube playlist link.");
            }
            const youtubeTitles = await fetchAllYouTubePlaylistVideos(textInput);
            if(!youtubeTitles || youtubeTitles.length === 0) {
                throw new Error("No videos found in playlist or playlist is private.");
            }
            const spotifyTrackSets = await multiThreeSongSearch(youtubeTitles, session?.accessToken);
            const sValues = await compareSpotifyYoutube(youtubeTitles, spotifyTrackSets);
            setsimValues(sValues);
            console.log(sValues);
            
        } catch (err) {
            console.error("Conversion error:", err);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmitButton = async () => {
        const submitURI = simValues?.filter(item => item.confirmed).map(item=> item.track.uri) || [];
        const playlistID = await createNewPlaylist(session?.accessToken, "Youtube Conversion");
        addToPlaylist(session?.accessToken, submitURI, playlistID);
    }

    const handleCheckboxChange = (index: number) => {
        if(!simValues) return;
        const updatedSimValues = [...simValues];
        updatedSimValues[index].confirmed = !updatedSimValues[index].confirmed;
        setsimValues(updatedSimValues);
    }

    return(
        <>
        <Header></Header>
        {!loading && <form onSubmit={handleSubmit} className="converter-playlist-container">
            <input type="text" 
            value={textInput} 
            placeholder="Input a public YouTube playlist link to convert to Spotify..."
            onChange={(e) => setNewTextInput(e.target.value)} 
            className="converter-playlist-input"></input>
        </form>}
        {loading && <header className="loadingText">Converting playlist. This may take a few minutes depending on size.</header>}
        <div className="converter-table-container">
           {simValues && <table className = "converterTable">
                <thead>
                    <tr>
                        <th className="text-center">Confirm</th>
                        <th className="text-center">YouTube Video</th>
                        <th className="text-center">Matched Spotify Track</th>
                        <th className="text-center">Artists</th>
                        <th className="text-center">Similarity Score</th>
                    </tr>
                </thead>
                 <tbody>
                    {simValues?.map((item, index) => (
                        <tr key={index} className={!item.confirmed ? "low-similarity" : ''}>
                        <td className="text-center">
                            <input type="checkbox" checked={item.confirmed} onChange={() => handleCheckboxChange(index)}/>
                        </td>
                        <td className="text-center">{item.youtubeTitle}</td>
                        <td className="text-center">{item.track.name}</td>
                        <td className="text-center">{item.track.artists.map(artist => artist.name).join(", ")}</td>
                        <td className="text-center">{(item.similarity * 100).toFixed(1)}%</td>
                </tr>))}
                </tbody>
            </table>}
            {simValues && (
                <div className="converter-button-container">
                    <button onClick={handleSubmitButton} className="converter-submit-button">
                        Submit Playlist
                    </button>
                </div>
            )}
        </div>
        </>
    )
}