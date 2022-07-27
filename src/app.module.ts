import { Module } from "@nestjs/common";
import "dotenv/config";
import { AppController } from "./app.controller.js";
import { AppNodeService } from "./app.node.service.js";

@Module({
    controllers: [AppController],
    providers: [AppNodeService],
    imports: []
})

export class AppModule {}
