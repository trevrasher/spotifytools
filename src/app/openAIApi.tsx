"use server"

import OpenAI from "openai";
import { Agent, run } from '@openai/agents';
const client = new OpenAI();

const simAgent = new Agent({
  name: "Similarity agent",
  model:"gpt-5-mini",
  instructions: "You will be given the title of a song on YouTube and the metadata of three different Spotify tracks. Your goal is to evaluate how similar the YouTube video is to each of the Spotify tracks on a scale of 0 to 1, with zero being no chance of them being the same and one being 100% chance of them being the same. When answering, return all similarity values. This is the format that you should return in: Song 2: 0.97\n\n"
});

export interface sToTrack {
  youtubeTitle: string
  track: SpotifyTrack;
  similarity: number;
}



import { SpotifyTrack } from "./spotifyApi";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


export async function compareSpotifyYoutube(
  youtubeTitles: string[], 
  spotifyTrackSets: SpotifyTrack[][]
): Promise<sToTrack[]> {
  let prompt = `You will be given multiple YouTube video titles and for each one, three Spotify tracks to compare against. For each YouTube video, return only the most similar Spotify track number (1-3) and similarity score (0-1).

  Format your response exactly like this:
  Video 1: Song 2: 0.97
  Video 2: Song 1: 0.84
  Video 3: Song 3: 0.91

  YouTube Videos and Spotify Tracks:\n\n`;

  youtubeTitles.forEach((youtubeTitle, videoIndex) => {
    prompt += `Video ${videoIndex + 1}: "${youtubeTitle}"\n`;
    
    const spotifyTracks = spotifyTrackSets[videoIndex];
    spotifyTracks.forEach((track, trackIndex) => {
      const artists = track.artists.map(a => a.name).join(", ");
      prompt += `  Song ${trackIndex + 1}: ${track.name} by ${artists}\n`;
    });
    prompt += '\n';
  });
  const response = await client.responses.create({
    model:"gpt-5-mini",
    input:prompt
  })
        
  const data = await response;
  const returnString = data.output_text;
  console.log(data);
  return parseBatchResponse(returnString, youtubeTitles, spotifyTrackSets);
}


function parseBatchResponse(
  responseText: string, 
  youtubeTitles: string[],
  spotifyTrackSets: SpotifyTrack[][]
): sToTrack[] {
  const results: sToTrack[] = [];
  const lines = responseText.split('\n');

  lines.forEach(line => {
    const match = line.match(/Video\s*(\d+):\s*Song\s*(\d+):\s*([01](?:\.\d+)?)/);
    if(match) {
      const videoIndex = parseInt(match[1], 10) - 1;
      const songIndex = parseInt(match[2], 10) - 1;
      const similarity = parseFloat(match[3]);
      const track = spotifyTrackSets[videoIndex]?.[songIndex];
    if (track) {
        results.push({ youtubeTitle: youtubeTitles[videoIndex], track, similarity });
    }}});
  return results;
  }

