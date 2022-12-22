/* eslint-disable no-nested-ternary */
import "reflect-metadata";
import "dotenv/config";

import Fastify from "fastify";
import PinoPretty from "pino-pretty";
import Pino from "pino";
import { NodeOptions } from "./types";
import { cast } from "@sapphire/utilities";
import { REST } from "@kirishima/rest";
import { LoadTypeEnum } from "lavalink-api-types";

const fastify = Fastify({
    logger: Pino({
        name: "nezu",
        timestamp: true,
        level: process.env.NODE_ENV === "production" ? "info" : "trace",
        formatters: {
            bindings: () => ({
                pid: "Nezly"
            })
        }
    }, PinoPretty())
});

function getLavalinkNode(nodeName?: string, excludeNode?: string): REST {
    const nodes: NodeOptions[] = JSON.parse(cast(process.env.LAVALINKS ?? []));
    const firstNode = nodes
        .filter(node => (excludeNode ? node.name !== excludeNode : nodeName ? node.name === nodeName : true))[
            nodeName ? 0 : Math.floor(Math.random() * (excludeNode ? nodes.length - 1 : nodes.length))
        ];
    return new REST(`${firstNode.secure ? "https" : "http"}://${firstNode.host}`)
        .setAuthorization(firstNode.auth);
}

fastify.get("/", () => ({ message: "LavaLink REST Proxy API" }));

fastify.get("/loadtracks", {
    schema: {
        querystring: {
            identifier: { type: "string" }
        }
    },
    preHandler: async (request, reply) => {
        const { identifier } = request.query as { identifier?: string };

        if (!identifier) return reply.send({ playlistInfo: {}, loadType: LoadTypeEnum.NO_MATCHES, tracks: [] });
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return reply.status(401);
    }
}, async (request, reply) => {
    const node = getLavalinkNode();
    const { identifier } = request.query as { identifier: string };

    const source = identifier.split(":")[0];
    const query = identifier.split(":")[1];

    const result = await node.loadTracks(source ? { source, query } : identifier);
    return reply.send(result);
});

fastify.get("/decodetrack", {
    schema: {
        querystring: {
            track: { type: "string" }
        }
    },
    preHandler: async (request, reply) => {
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return reply.status(401);
    }
}, async (request, reply) => {
    const node = getLavalinkNode();
    const { track } = request.query as { track: string };

    const result = await node.decodeTracks(track);
    return reply.send(result);
});

fastify.post("/decodetracks", {
    preHandler: async (request, reply) => {
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return reply.status(401);
    }
}, async (request, reply) => {
    const node = getLavalinkNode();
    const { tracks } = request.body as { tracks: string };

    const result = await node.decodeTracks(tracks);
    return reply.send(result);
});

void fastify.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });
