import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { Liquid } from "liquidjs";
import * as session from "express-session";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as passport from "passport";
import flash = require("connect-flash");
import { bootstrapLocals } from "./common";
import queryMutator from "./common/query-mutator";
import { env } from "process";
import * as morgan from "morgan";
import { GlobalHttpExceptionFilter } from "./filters/global-http-exceptions.filter";

async function bootstrap() {
    // Read AWS secrets and assign them to environment variables
    if (env.SECRETS) {
        const secrets = JSON.parse(env.SECRETS);
        for (const key in secrets) {
            env[key] = secrets[key];
        }
    }

    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useGlobalPipes(new ValidationPipe());

    app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

    // View connection
    const liquid = new Liquid({
        root: join(__dirname, "views"),
        extname: ".liquid",
    });
    liquid.registerFilter("mut-query", queryMutator);

    app.engine("liquid", liquid.express());
    app.set("views", join(__dirname, "views")); // specify the views directory
    app.set("view engine", "liquid"); // set liquid to default

    const config = new DocumentBuilder()
        .setTitle("Exchange Bot API")
        .setVersion("<VERSION>") // Is replaced with the actual version during the docker build process
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);

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

    // Add global exception filter for logging purposes
    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    await app.listen(3000, "0.0.0.0");
    Logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
