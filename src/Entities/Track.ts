import { Entity, Schema } from "redis-om";

export class Track extends Entity { }

export const TrackSchema = new Schema(Track, {
    track: { type: "string" },
    identifier: { type: "string" },
    isSeekable: { type: "boolean" },
    author: { type: "string" },
    length: { type: "number" },
    isStream: { type: "boolean" },
    position: { type: "number" },
    title: { type: "text" },
    uri: { type: "text" },
    sourceName: { type: "string" },
    artworkUrl: { type: "string" }
});
