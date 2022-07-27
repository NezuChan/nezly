import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import { Response, Request } from "express";
import { LoadTypeEnum } from "lavalink-api-types";
import { AppNodeService } from "./app.node.service";
import { REST } from "@kirishima/rest";
import { Result } from "@sapphire/result";

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
            excludeNode?: string
    ): Promise<Response> {
        if (!identifier) return res.json({ playlistInfo: {}, loadType: LoadTypeEnum.NO_MATCHES, tracks: [] });
        if (req.headers.authorization !== process.env.AUTHORIZATION) return res.status(401);
        const node = this.appNodeService.getLavalinkNode(excludeNode);
        const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
            .setAuthorization(node.auth);

        const source = identifier.split(":")[0];
        const query = identifier.split(":")[1];

        const timeout = setTimeout(() => Result.fromAsync(this.getLoadTracks(res, req, identifier, node.name)), 5000);
        const result = await nodeRest.loadTracks(source ? { source, query } : identifier);
        clearTimeout(timeout);

        if (!result.tracks.length) return this.getLoadTracks(res, req, identifier, node.name);
        return res.json(result);
    }

    @Get("/decodeTrack")
    public async getDecodeTrack(
        @Res() res: Response,
            @Req() req: Request,
            @Query("track") track: string,
            excludeNode?: string
    ): Promise<Response> {
        if (req.headers.authorization !== process.env.AUTHORIZATION) return res.status(401);
        const node = this.appNodeService.getLavalinkNode(excludeNode);
        const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
            .setAuthorization(node.auth);

        const timeout = setTimeout(() => Result.fromAsync(this.getLoadTracks(res, req, track, node.name)), 5000);
        const result = await nodeRest.decodeTracks(track);
        clearTimeout(timeout);

        return res.json(result[0].info);
    }

    @Post("/decodeTracks")
    public async postDecodeTracks(
        @Res() res: Response,
            @Req() req: Request,
            @Body() tracks: string,
            excludeNode?: string
    ): Promise<Response> {
        if (req.headers.authorization !== process.env.AUTHORIZATION) return res.status(401);
        const node = this.appNodeService.getLavalinkNode(excludeNode);
        const nodeRest = new REST(node.secure ? `https://${node.host}` : `http://${node.host}`)
            .setAuthorization(node.auth);

        const timeout = setTimeout(() => Result.fromAsync(this.getLoadTracks(res, req, tracks, node.name)), 5000);
        const result = await nodeRest.decodeTracks(tracks);
        clearTimeout(timeout);

        return res.json(result.map(x => x.info));
    }
}
