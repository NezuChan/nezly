/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import { Response, Request } from "express";
import { LoadTypeEnum } from "lavalink-api-types";
import { AppNodeService } from "./app.node.service";
import { REST } from "@kirishima/rest";
import { Result } from "@sapphire/result";
import { Time } from "@sapphire/time-utilities";
import { AppCacheService } from "./app.cache.service";

@Controller()

export class AppController {
    public constructor(
        private readonly appNodeService: AppNodeService,
        private readonly appCacheService: AppCacheService
    ) {}

    @Get()
    public getIndex(@Res() res: Response): Response {
        return res.json({ message: "LavaLink REST Proxy API" });
    }

    @Get("/loadtracks")
    public async getLoadTracks(
        @Res() res: Response,
            @Req() req: Request,
            @Query("identifier") identifier?: string,
            excludeNode?: string,
            resolveAttempt?: number
    ): Promise<Response> {
        try {
            if (req.headers.authorization !== process.env.AUTHORIZATION) return res.sendStatus(401);
            if (!identifier || (resolveAttempt && resolveAttempt > 3)) return res.json({ playlistInfo: {}, loadType: LoadTypeEnum.NO_MATCHES, tracks: [] });

            const source = identifier.split(":")[0];
            const query = identifier.split(":")[1];

            const cachedTracks = await this.appCacheService.trackRepository()
                .search()
                .where("title")
                .matches(query)
                .and("sourceName")
                .equalTo("youtube")
                .return.all();

            if (cachedTracks.length) {
                return res
                    .header({ "x-cache-hits": true })
                    .json({
                        // TODO: rework this
                        loadType: LoadTypeEnum.SEARCH_RESULT,
                        tracks: cachedTracks.map(x => ({
                            info: {
                                identifier: x.toJSON().identifier,
                                isSeekable: x.toJSON().isSeekable,
                                author: x.toJSON().author,
                                length: x.toJSON().length,
                                isStream: x.toJSON().isStream,
                                position: x.toJSON().position,
                                title: x.toJSON().title,
                                uri: x.toJSON().uri,
                                sourceName: x.toJSON().sourceName,
                                artworkUrl: x.toJSON().artworkUrl
                            },
                            track: x.toJSON().track
                        }))
                    });
            }

            const node = this.appNodeService.getLavalinkNode(req.headers["x-node-name"] as string, excludeNode);
            const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
                .setAuthorization(node.auth);

            const timeout = setTimeout(() => Result.fromAsync(this.getLoadTracks(res, req, identifier, node.name)), Time.Second * Number(process.env.TIMEOUT_SECONDS ?? 3));
            const result = await nodeRest.loadTracks(source ? { source, query } : identifier);
            clearTimeout(timeout);

            if (!result.tracks.length) return await this.getLoadTracks(res, req, identifier, node.name, (resolveAttempt ?? 0) + 1);
            for (const track of result.tracks) await this.appCacheService.trackRepository().createAndSave({ track: track.track, ...track.info });
            return res.json(result);
        } catch (e) {
            return res.status(500).json({ status: 500, message: e.message });
        }
    }

    @Get("/decodetrack")
    public async getDecodeTrack(
        @Res() res: Response,
            @Req() req: Request,
            @Query("track") track: string,
            excludeNode?: string
    ): Promise<Response> {
        try {
            if (req.headers.authorization !== process.env.AUTHORIZATION) return res.sendStatus(401);

            const cachedTrack = await this.appCacheService.trackRepository()
                .search()
                .where("track")
                .equalTo(track)
                .return.first();

            if (cachedTrack) {
                return res
                    .header({ "x-cache-hits": true })
                    .json({
                        identifier: cachedTrack.toJSON().identifier,
                        isSeekable: cachedTrack.toJSON().isSeekable,
                        author: cachedTrack.toJSON().author,
                        length: cachedTrack.toJSON().length,
                        isStream: cachedTrack.toJSON().isStream,
                        position: cachedTrack.toJSON().position,
                        title: cachedTrack.toJSON().title,
                        uri: cachedTrack.toJSON().uri,
                        sourceName: cachedTrack.toJSON().sourceName,
                        artworkUrl: cachedTrack.toJSON().artworkUrl
                    });
            }

            const node = this.appNodeService.getLavalinkNode(req.headers["x-node-name"] as string, excludeNode);
            const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
                .setAuthorization(node.auth);

            const timeout = setTimeout(() => Result.fromAsync(this.getDecodeTrack(res, req, track, node.name)), Time.Second * Number(process.env.TIMEOUT_SECONDS ?? 3));
            const result = await nodeRest.decodeTracks([track]);
            clearTimeout(timeout);

            return res.json(result[0].info);
        } catch (e) {
            return res.status(500).json({ status: 500, message: e.message });
        }
    }

    @Post("/decodetracks")
    public async postDecodeTracks(
        @Res() res: Response,
            @Req() req: Request,
            @Body() tracks: string,
            excludeNode?: string
    ): Promise<Response> {
        try {
            if (req.headers.authorization !== process.env.AUTHORIZATION) return res.sendStatus(401);
            const results: any[] = [];

            for (const track of tracks) {
                const cachedTrack = await this.appCacheService.trackRepository()
                    .search()
                    .where("track")
                    .equalTo(track)
                    .return.first();

                if (cachedTrack) {
                    results.push({
                        identifier: cachedTrack.toJSON().identifier,
                        isSeekable: cachedTrack.toJSON().isSeekable,
                        author: cachedTrack.toJSON().author,
                        length: cachedTrack.toJSON().length,
                        isStream: cachedTrack.toJSON().isStream,
                        position: cachedTrack.toJSON().position,
                        title: cachedTrack.toJSON().title,
                        uri: cachedTrack.toJSON().uri,
                        sourceName: cachedTrack.toJSON().sourceName,
                        artworkUrl: cachedTrack.toJSON().artworkUrl
                    });
                }
            }

            if (results.length) {
                return res
                    .header({ "x-cache-hits": true })
                    .json(results);
            }

            const node = this.appNodeService.getLavalinkNode(req.headers["x-node-name"] as string, excludeNode);
            const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
                .setAuthorization(node.auth);

            const timeout = setTimeout(() => Result.fromAsync(this.postDecodeTracks(res, req, tracks, node.name)), Time.Second * Number(process.env.TIMEOUT_SECONDS ?? 3));
            const result = await nodeRest.decodeTracks(tracks);
            clearTimeout(timeout);

            return res.json(result.map(x => x.info));
        } catch (e) {
            return res.status(500).json({ status: 500, message: e.message });
        }
    }

    public parseUrl(rawUrl: string): string | null {
        try {
            return rawUrl.split(":").slice(1, 3).join(":");
        } catch {
            return null;
        }
    }
}
