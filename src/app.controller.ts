/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import { Response, Request } from "express";
import { LoadTypeEnum } from "lavalink-api-types";
import { AppNodeService } from "./app.node.service";
import { REST } from "@kirishima/rest";
import { Result } from "@sapphire/result";
import { Time } from "@sapphire/time-utilities";

@Controller()

export class AppController {
    public constructor(private readonly appNodeService: AppNodeService) {}

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
            const node = this.appNodeService.getLavalinkNode(excludeNode);
            const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
                .setAuthorization(node.auth);

            const source = identifier.split(":")[0];
            const query = identifier.split(":")[1];

            const timeout = setTimeout(() => Result.fromAsync(this.getLoadTracks(res, req, identifier, node.name)), Time.Second * Number(process.env.TIMEOUT ?? 3));
            const result = await nodeRest.loadTracks(source ? { source, query } : identifier);
            clearTimeout(timeout);

            if (!result.tracks.length) return await this.getLoadTracks(res, req, identifier, node.name, (resolveAttempt ?? 0) + 1);
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
            const node = this.appNodeService.getLavalinkNode(excludeNode);
            const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
                .setAuthorization(node.auth);

            const timeout = setTimeout(() => Result.fromAsync(this.getDecodeTrack(res, req, track, node.name)), Time.Second * Number(process.env.TIMEOUT ?? 3));
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
            const node = this.appNodeService.getLavalinkNode(excludeNode);
            const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
                .setAuthorization(node.auth);

            const timeout = setTimeout(() => Result.fromAsync(this.postDecodeTracks(res, req, tracks, node.name)), Time.Second * Number(process.env.TIMEOUT ?? 3));
            const result = await nodeRest.decodeTracks(tracks);
            clearTimeout(timeout);

            return res.json(result.map(x => x.info));
        } catch (e) {
            return res.status(500).json({ status: 500, message: e.message });
        }
    }
}
