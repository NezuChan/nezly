import { Injectable } from "@nestjs/common";
import { Result } from "@sapphire/result";
import { Client, Repository } from "redis-om";
import { TrackSchema, Track } from "./Entities/Track";

@Injectable()
export class AppCacheService {
    public client = new Client();
    public constructor(
    ) {
        void Result.fromAsync(() => this.client.open(process.env.REDIS_URL));
        void Result.fromAsync(() => this.client.fetchRepository(TrackSchema).createIndex());
    }

    public trackRepository(): Repository<Track> {
        return this.client.fetchRepository(TrackSchema);
    }
}
