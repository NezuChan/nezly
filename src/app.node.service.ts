/* eslint-disable max-len */
import { Injectable } from "@nestjs/common";
import { cast } from "@sapphire/utilities";

@Injectable()
export class AppNodeService {
    public getLavalinkNode(nodeName?: string, excludeNode?: string): NodeOptions {
        const nodes: NodeOptions[] = JSON.parse(cast(process.env.LAVALINKS ?? []));
        return nodes.filter(node => (excludeNode ? node.name !== excludeNode : node.name === nodeName))[nodeName ? 0 : Math.floor(Math.random() * (excludeNode ? nodes.length - 1 : nodes.length))];
    }
}

interface NodeOptions {
    name: string;
    host: string;
    auth: string;
    secure?: boolean;
}
