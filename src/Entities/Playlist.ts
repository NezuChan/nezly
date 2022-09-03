import { Entity, Schema } from "redis-om";

export class Playlist extends Entity { }

export const PlaylistSchema = new Schema(Playlist, {
    playlistName: { type: "string" },
    playlistUrl: { type: "string" },
    playlistSelectedTrack: { type: "number" },
    tracks: { type: "string[]" }
});
