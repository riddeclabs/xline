import { Injectable } from "@nestjs/common";
import { Ctx, Start, Update } from "nestjs-telegraf";
import { Scenes } from "telegraf";
import { MainScene } from "./scenes/main.scene";

type StartContext = Scenes.SceneContext;

@Update()
@Injectable()
export class BotService {
    @Start()
    async startCommand(@Ctx() ctx: StartContext) {
        await ctx.scene.enter(MainScene.ID);
    }
}
