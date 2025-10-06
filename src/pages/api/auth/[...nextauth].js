import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";



export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
      params: {
        scope: "playlist-modify-public playlist-modify-private user-read-email user-read-private user-library-read"
      }
    }
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at * 1000,
        };
      }
      
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }
      
      console.log("Token expired, consider implementing refresh logic");
      return token;
    },
    
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
}

export default NextAuth(authOptions);