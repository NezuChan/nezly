import { Module } from "@nestjs/common";
import "dotenv/config";
import { AppController } from "./app.controller";
import { AppNodeService } from "./app.node.service";

@Module({
    controllers: [AppController],
    providers: [AppNodeService],
    imports: []
})

export class AppModule {}
