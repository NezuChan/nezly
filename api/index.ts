import { NestFactory } from "@nestjs/core";
import { AppModule } from "src/app.module";

const NezlyApp = (async () => {
    const app = await NestFactory.create(AppModule);

    await app.listen(parseInt(process.env.PORT ?? String(3000)));
})();

export default NezlyApp;
