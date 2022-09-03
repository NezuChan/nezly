import { Injectable } from "@nestjs/common";
import { Result } from "@sapphire/result";
import { Client, Repository } from "redis-om";
import { PlaylistSchema } from "./Entities/Playlist";
import { TrackSchema, Track } from "./Entities/Track";

@Injectable()
export class AppCacheService {
    public client = new Client();
    public constructor(
    ) {
        if (process.env.REDIS_URL) {
            void Result.fromAsync(() => this.client.open(process.env.REDIS_URL));
            void Result.fromAsync(() => this.client.fetchRepository(TrackSchema).createIndex());
            void Result.fromAsync(() => this.client.fetchRepository(PlaylistSchema).createIndex());
        }
    }

    public getTrackRepository(): Repository<Track> {
        return this.client.fetchRepository(TrackSchema);
    }

    public getPlaylistTrackRepository(): Repository<Track> {
        return this.client.fetchRepository(PlaylistSchema);
    }
}
