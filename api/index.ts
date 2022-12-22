import Fastify from "fastify";

const fastify = Fastify({
    logger: {
        name: "nezu",
        timestamp: true,
        level: process.env.NODE_ENV === "production" ? "info" : "trace",
        formatters: {
            bindings: () => ({
                pid: "Nezly"
            })
        },
        transport: {
            targets: [
                { target: "pino-pretty", level: process.env.NODE_ENV === "production" ? "info" : "trace", options: { translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l o" } }
            ]
        }
    }
});

fastify.get("/", () => ({ message: "LavaLink REST Proxy API" }));

void fastify.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });
