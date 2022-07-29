import { Injectable } from "@nestjs/common";
import { cast } from "@sapphire/utilities";

@Injectable()
export class AppNodeService {
    public getLavalinkNode(excludeNode?: string): NodeOptions {
        const nodes: NodeOptions[] = JSON.parse(cast(process.env.LAVALINKS ?? []));
        return nodes.filter(node => node.name !== excludeNode)[Math.floor(Math.random() * (excludeNode ? nodes.length - 1 : nodes.length))];
    }
}

interface NodeOptions {
    name: string;
    host: string;
    auth: string;
    secure?: boolean;
}
