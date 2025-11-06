"use client"
import Header from "@/components/header"
import { useState } from "react"
import { fetchAllYouTubePlaylistVideos } from "../../lib/youtubeApi";
import { compareSpotifyYoutube } from "../../lib/openAIApi";
import { multiThreeSongSearch } from "../../lib/spotifyApi";
import { useSession } from "next-auth/react";
import { sToTrack } from "../../lib/openAIApi";
import { createNewPlaylist, addToPlaylist} from "../../lib/spotifyApi";
import ErrorPopup from "@/components/errorPopup";

const YOUTUBE_PLAYLIST_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*[?&]list=([a-zA-Z0-9_-]+)/;
const DEFAULT_PLAYLIST_NAME = "Youtube Conversion";
const SIMILARITY_THRESHOLD = 0.95;

export default function YoutubeConverter() {
    const { data: session } = useSession();
    const [textInput, setNewTextInput] = useState<string>("");
    const [simValues, setsimValues] = useState<sToTrack[]>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const validateYoutubeUrl = (url: string): boolean => {
        return YOUTUBE_PLAYLIST_REGEX.test(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateYoutubeUrl(textInput)) {
            setError("Please enter a valid YouTube playlist link.");
            return;
        }

        setNewTextInput("");
        setLoading(true);

        try {
            const youtubeTitles = await fetchAllYouTubePlaylistVideos(textInput);
            
            if (!youtubeTitles || youtubeTitles.length === 0) {
                throw new Error("No videos found in playlist or playlist is private.");
            }
            
            const spotifyTrackSets = await multiThreeSongSearch(youtubeTitles, session?.accessToken);
            const sValues = await compareSpotifyYoutube(youtubeTitles, spotifyTrackSets);
            
            setsimValues(sValues);
            console.log(sValues);
            
        } catch (err) {
            console.error("Conversion error:", err);
            setError("An error occurred during conversion");
        } finally {
            setLoading(false);
        }
    }

    const handleSubmitButton = async () => {
        if (!simValues) return;
        
        const confirmedTracks = simValues
            .filter(item => item.confirmed)
            .map(item => item.track.uri);
        
        if (confirmedTracks.length === 0) {
            setError("Please select at least one track to add to the playlist.");
            return;
        }
        
        try {
            const playlistID = await createNewPlaylist(session?.accessToken, DEFAULT_PLAYLIST_NAME);
            await addToPlaylist(session?.accessToken, confirmedTracks, playlistID);
        } catch (err) {
            console.error("Playlist creation error:", err);
            setError("Failed to create playlist. Please try again.");
        }
    }

    const handleCheckboxChange = (index: number) => {
        if (!simValues) return;
        
        const updatedSimValues = [...simValues];
        updatedSimValues[index].confirmed = !updatedSimValues[index].confirmed;
        setsimValues(updatedSimValues);
    }

    const formatSimilarityScore = (similarity: number): string => {
        return `${(similarity * 100).toFixed(0)}%`;
    };

    const getRowClassName = (confirmed: boolean, similarity:number) : string => {
        return (!confirmed && similarity<SIMILARITY_THRESHOLD) ? 'low-similarity' : '';
    };

    return (
        <>
            <Header />
            {!loading && (
                <form onSubmit={handleSubmit} className="converter-playlist-container">
                    <input 
                        type="text" 
                        value={textInput} 
                        placeholder="Input a public YouTube playlist link to convert to Spotify..."
                        onChange={(e) => setNewTextInput(e.target.value)} 
                        className="converter-playlist-input"
                    />
                </form>
            )}
            
            {loading && (
                <header className="loadingText">
                    Converting playlist. This may take a few minutes depending on size.
                </header>
            )}
            
            <div className="converter-table-container">
                {simValues && (
                    <>
                        <table className="converterTable">
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
                                {simValues.map((item, index) => (
                                    <tr key={index} className={getRowClassName(item.confirmed, item.similarity)}>
                                        <td className="text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={item.confirmed} 
                                                onChange={() => handleCheckboxChange(index)}
                                            />
                                        </td>
                                        <td className="text-center">{item.youtubeTitle}</td>
                                        <td className="text-center">{item.track.name}</td>
                                        <td className="text-center">
                                            {item.track.artists.map(artist => artist.name).join(", ")}
                                        </td>
                                        <td className="text-center">
                                            {formatSimilarityScore(item.similarity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="converter-button-container">
                            <button 
                                onClick={handleSubmitButton} 
                                className="btn btn-primary btn-lg"
                            >
                                Submit Playlist
                            </button>
                        </div>
                    </>
                )}
            </div>
            <ErrorPopup errorText={error} onClear={() => setError(null)} />
        </>
    )
}