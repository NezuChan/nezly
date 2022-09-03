import { Module } from "@nestjs/common";
import "dotenv/config";
import { AppCacheService } from "./app.cache.service";
import { AppController } from "./app.controller";
import { AppNodeService } from "./app.node.service";

@Module({
    controllers: [AppController],
    providers: [AppNodeService, AppCacheService],
    imports: []
})

export class AppModule {}
