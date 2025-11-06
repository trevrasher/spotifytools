import { SpotifyTrackItem, filteredArtist } from '../../lib/spotifyApi';

export function artistFilter(data: SpotifyTrackItem[]) {
    const artists: { [name: string]: filteredArtist } = {};
    data.forEach((trackItem: SpotifyTrackItem) => {
        const artist = trackItem.track.artists[0];
        const name = artist.name;
        if (!artists[name]) {
            artists[name] = {
                artistName: name,
                count: 1,
                image: trackItem.track.album.images[0]?.url || "",
                trackIDs: [trackItem]
            };
        } else {
            artists[name].count += 1;
            artists[name].trackIDs.push(trackItem);
        }
    });
    return Object.values(artists);
}