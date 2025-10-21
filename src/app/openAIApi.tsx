"use server"

import OpenAI from "openai";
import { Agent, run } from '@openai/agents';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const simAgent = new Agent({
  name: "Similarity agent",
  model:"gpt-5-mini",
  instructions: "You will be given the title of a song on YouTube and the metadata of three different Spotify tracks. Your goal is to evaluate how similar the YouTube video is to each of the Spotify tracks on a scale of 0 to 1, with zero being no chance of them being the same and one being 100% chance of them being the same. When answering, return all similarity values. This is the format that you should return in: Song 2: 0.97\n\n"
});

export interface sToTrack {
  youtubeTitle: string
  track: SpotifyTrack;
  similarity: number;
  confirmed: boolean;
}



import { SpotifyTrack } from "./spotifyApi";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


export async function compareSpotifyYoutube(
  youtubeTitles: string[], 
  spotifyTrackSets: SpotifyTrack[][]
): Promise<sToTrack[]> {
  let prompt = `Begin with a concise checklist (3-7 bullets) of your approach before analyzing the YouTube videos and their paired Spotify tracks. For each YouTube video, identify the single most similar Spotify track, specifying its track number (1–3) and a similarity score between 0 and 1. Format your response exactly as follows:
V1: S2: 0.97
V2: S1: 0.84
V2: S3: 0.91
Only produce output in this specified format. List of YouTube videos and their corresponding Spotify tracks:\n\n`;

  youtubeTitles.forEach((youtubeTitle, videoIndex) => {
    prompt += `V${videoIndex + 1}:"${youtubeTitle}"\n`;
    
    const spotifyTracks = spotifyTrackSets[videoIndex];
    spotifyTracks.forEach((track, trackIndex) => {
      const artists = track.artists.map(a => a.name).join(",");
      prompt += `S${trackIndex + 1}:${track.name}-${artists}\n`;
    });
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
    const match = line.match(/V(\d+):\s*S(\d+):\s*([01](?:\.\d+)?)/);
    if(match) {
      const videoIndex = parseInt(match[1], 10) - 1;
      const songIndex = parseInt(match[2], 10) - 1;
      const similarity = parseFloat(match[3]);
      const track = spotifyTrackSets[videoIndex]?.[songIndex];
    if (track && similarity>0.94) {
        results.push({ youtubeTitle: youtubeTitles[videoIndex], track, similarity, confirmed:true });
    }
    if (track && similarity<=0.94) {
        results.push({ youtubeTitle: youtubeTitles[videoIndex], track, similarity, confirmed:false });
    }
    }});
  return results;
  }

