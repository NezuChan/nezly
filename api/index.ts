/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-nested-ternary */
import "reflect-metadata";
import "dotenv/config";

import Fastify from "fastify";
import PinoPretty from "pino-pretty";
import Pino from "pino";
import { NodeOptions } from "./types";
import { cast } from "@sapphire/utilities";
import { REST } from "@kirishima/rest";
import { fetch } from "undici";
import { BodyInit } from "undici/types/fetch";
import { Result } from "@sapphire/result";
import { Time } from "@sapphire/time-utilities";

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

for (const route of cast<string[]>(JSON.parse(process.env.DISABLED_ROUTES ?? "[]"))) {
    fastify.route({
        method: ["GET", "POST", "PATCH"],
        url: route,
        handler: async (request, reply) => reply.status(404).send({ timestamp: new Date().toISOString(), status: 404, error: "Not Found", message: "Not Found", path: request.url })
    });
}

fastify.get("/loadtracks", {
    schema: {
        querystring: {
            identifier: { type: "string" }
        }
    },
    preHandler: async (request, reply, done) => {
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return done(new Error("Unauthorized"));
    }
}, async (request, reply) => {
    const { identifier } = request.query as { identifier: string };

    const source = identifier.split(":")[0];
    const query = identifier.split(":")[1];

    const fetchTracks = async () => {
        if (reply.sent) return;
        const result = await getLavalinkNode(
            Array.isArray(request.headers["x-node-name"]) ? request.headers["x-node-name"][0] : request.headers["x-node-name"]
        )
            .loadTracks(source ? { source, query } : identifier);

        if (process.env.WEBHOOK_URL) {
            void Result.fromAsync(async () => {
                await fetch(process.env.WEBHOOK_URL!, {
                    headers: {
                        Authorization: process.env.WEBHOOK_AUTHORIZATION!
                    },
                    method: "POST",
                    body: JSON.stringify({
                        ...result,
                        type: "LOAD_TRACKS",
                        user: request.headers["x-requester-id"] ?? null
                    })
                });
            });
        }
        return reply.send(result);
    };

    const timeout = setTimeout(() => Result.fromAsync(() => fetchTracks()), Time.Second * Number(process.env.TIMEOUT_SECONDS ?? 3));
    return fetchTracks().then(() => clearTimeout(timeout));
});

fastify.get("/decodetrack", {
    schema: {
        querystring: {
            track: { type: "string" }
        }
    },
    preHandler: async (request, reply, done) => {
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return done(new Error("Unauthorized"));
    }
}, async (request, reply) => {
    const node = getLavalinkNode(
        Array.isArray(request.headers["x-node-name"]) ? request.headers["x-node-name"][0] : request.headers["x-node-name"]
    );
    const { track } = request.query as { track: string };

    const fetchTracks = async () => {
        if (reply.sent) return;
        const result = await node.decodeTracks(track);
        if (process.env.WEBHOOK_URL) {
            void Result.fromAsync(async () => {
                await fetch(process.env.WEBHOOK_URL!, {
                    method: "POST",
                    headers: {
                        Authorization: process.env.WEBHOOK_AUTHORIZATION!
                    },
                    body: JSON.stringify({
                        type: "DECODE_TRACKS",
                        user: request.headers["x-requester-id"] ?? null,
                        tracks: result
                    })
                });
            });
        }
        return reply.send(result[0].info);
    };

    const timeout = setTimeout(() => Result.fromAsync(() => fetchTracks()), Time.Second * Number(process.env.TIMEOUT_SECONDS ?? 3));
    return fetchTracks().then(() => clearTimeout(timeout));
});

fastify.post("/decodetracks", {
    preHandler: async (request, reply, done) => {
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return done(new Error("Unauthorized"));
    }
}, async (request, reply) => {
    const node = getLavalinkNode(
        Array.isArray(request.headers["x-node-name"]) ? request.headers["x-node-name"][0] : request.headers["x-node-name"]
    );
    const { tracks } = request.body as { tracks: string };
    const fetchTracks = async () => {
        if (reply.sent) return;
        const result = await node.decodeTracks(tracks);
        if (process.env.WEBHOOK_URL) {
            void Result.fromAsync(async () => {
                await fetch(process.env.WEBHOOK_URL!, {
                    method: "POST",
                    headers: {
                        Authorization: process.env.WEBHOOK_AUTHORIZATION!
                    },
                    body: JSON.stringify({
                        type: "DECODE_TRACKS",
                        user: request.headers["x-requester-id"] ?? null,
                        tracks: result
                    })
                });
            });
        }
        return reply.send(result.map(x => x.info));
    };

    const timeout = setTimeout(() => Result.fromAsync(() => fetchTracks()), Time.Second * Number(process.env.TIMEOUT_SECONDS ?? 3));
    return fetchTracks().then(() => clearTimeout(timeout));
});

fastify.get("*", {
    preHandler: async (request, reply, done) => {
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return done(new Error("Unauthorized"));
    }
}, async (request, reply) => {
    const node = getLavalinkNode(
        Array.isArray(request.headers["x-node-name"]) ? request.headers["x-node-name"][0] : request.headers["x-node-name"]
    );
    const fetchResult = await fetch(`${node.url}${request.url}`, { method: "GET", headers: { ...node.headers } });
    if (fetchResult.headers.get("content-type")?.startsWith("application/json")) return reply.status(fetchResult.status).send(await fetchResult.json());
    return reply.status(fetchResult.status).send(await fetchResult.text());
});

fastify.post("*", {
    preHandler: async (request, reply, done) => {
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return done(new Error("Unauthorized"));
    }
}, async (request, reply) => {
    const node = getLavalinkNode(
        Array.isArray(request.headers["x-node-name"]) ? request.headers["x-node-name"][0] : request.headers["x-node-name"]
    );
    const fetchResult = await fetch(`${node.url}${request.url}`, { method: "POST", body: request.body as BodyInit, headers: { ...node.headers } });
    if (fetchResult.headers.get("content-type")?.startsWith("application/json")) return reply.status(fetchResult.status).send(await fetchResult.json());
    return reply.status(fetchResult.status).send(await fetchResult.text());
});

fastify.patch("*", {
    preHandler: async (request, reply, done) => {
        if (process.env.AUTHORIZATION && request.headers.authorization !== process.env.AUTHORIZATION) return done(new Error("Unauthorized"));
    }
}, async (request, reply) => {
    const node = getLavalinkNode(
        Array.isArray(request.headers["x-node-name"]) ? request.headers["x-node-name"][0] : request.headers["x-node-name"]
    );
    const fetchResult = await fetch(`${node.url}${request.url}`, { method: "patch", body: request.body as BodyInit, headers: { ...node.headers } });
    if (fetchResult.headers.get("content-type")?.startsWith("application/json")) return reply.status(fetchResult.status).send(await fetchResult.json());
    return reply.status(fetchResult.status).send(await fetchResult.text());
});

void fastify.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });
