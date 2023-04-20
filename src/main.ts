import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { Liquid } from "liquidjs";
import * as session from "express-session";
import * as passport from "passport";
import flash = require("connect-flash");
import { bootstrapLocals } from "./common";
import queryMutator from "./common/query-mutator";
import { env } from "process";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useGlobalPipes(new ValidationPipe());

    // View connection
    const liquid = new Liquid({
        root: join(__dirname, "views"),
        extname: ".liquid",
    });
    liquid.registerFilter("mut-query", queryMutator);

    app.engine("liquid", liquid.express());
    app.set("views", join(__dirname, "views")); // specify the views directory
    app.set("view engine", "liquid"); // set liquid to default

    app.enableShutdownHooks();

    if (!env.SESSION_SECRET_KEY) {
        throw new Error("SESSION_SECRET_KEY is not defined");
    }

    app.use(
        session({
            secret: env.SESSION_SECRET_KEY,
            resave: false,
            saveUninitialized: false,
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.use(bootstrapLocals);

    await app.listen(3000, "0.0.0.0");
    Logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
