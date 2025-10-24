# Spotify Tools

A frontend web application that allows users to rapidly organize their Liked Songs and convert YouTube playlists to Spotify, featuring OpenAI powered track matching

## Features

- **Playlist Creation from Liked Songs**: Rapidly create large playlists by selecting artists from your Spotify liked songs
- **Artist Placement Tracking**: Easily monitor which artists have been placed thus far. You may also place each artist multiple times.
- **YouTube to Spotify Conversion**: AI-powered conversion of YouTube playlists to Spotify using OpenAI's GPT models
- **Similarity Scoring**: Tracks that AI is unconfident about will be highlighted in red, facilitating easy human intervention

## Live Demo

[View Live Application](https://spotifytools.vercel.app)

## Tech Stack

### Frontend
- **React**
- **Next.js**
- **TypeScript** 

### Backend
- **NextAuth.js** 
- **Spotify Web API** 
- **YouTube Data API** 
- **OpenAI API** 

### Infrastructure
- **Vercel** 

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/trevrasher/spotifytools.git
   cd spotifytools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   SPOTIFY_CLIENT_ID="your_spotify_client_id"
   SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
   YOUTUBE_API_KEY="your_youtube_api_key"
   OPENAI_API_KEY="your_openai_api_key"
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Configure Spotify App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app and add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
   - Copy the Client ID and Client Secret to your `.env.local`

5. **Set up Google Cloud (for YouTube API)**
   - Enable YouTube Data API v3 in Google Cloud Console
   - Create an API key and add it to your `.env.local`

6. **Set up OpenAI**
   - Get an API key from [OpenAI Platform](https://platform.openai.com)
   - Add it to your `.env.local`

7. **Run the development server**
   ```bash
   npm run dev
   ```

