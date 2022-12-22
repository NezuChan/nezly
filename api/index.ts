import Fastify from "fastify";
import PinoPretty from "pino-pretty";
import Pino from "pino";

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

fastify.get("/", () => ({ message: "LavaLink REST Proxy API" }));

void fastify.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });
