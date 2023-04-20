import { Module } from "@nestjs/common";

import { BotService } from "./bot.service";

@Module({
    imports: [],
    controllers: [],
    providers: [BotService],
})
export class BotModule {}
