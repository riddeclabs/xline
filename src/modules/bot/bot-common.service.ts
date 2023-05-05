import { Injectable } from "@nestjs/common";
import { MAIN_MENU_OPTIONS } from "./constants";
import { generateCBData } from "./helpers";
import { Ctx } from "nestjs-telegraf";
import { ExtendedWizardContext } from "./bot.types";
import { Message } from "typegram";
import { MiddlewareFn, MiddlewareObj } from "telegraf";

@Injectable()
export class BotCommonService {
    goBackButton() {
        return {
            text: "↩ Go to main menu",
            callback_data: generateCBData(MAIN_MENU_OPTIONS.BACK_MAIN_MENU),
        };
    }

    async tryToDeleteMessages(@Ctx() ctx: ExtendedWizardContext) {
        const allMessageIds = ctx.scene.session.state.sceneMessageIds;
        if (allMessageIds && allMessageIds.length) {
            try {
                await Promise.all(
                    allMessageIds.map((message_id: number) => {
                        return ctx.deleteMessage(message_id);
                    })
                );
            } catch (e) {
                // in case target message was deleted previously
            }

            // Clean up all messages
            ctx.scene.session.state.sceneMessageIds = [];
        }

        try {
            await ctx.deleteMessage();
        } catch (e) {}
    }

    tryToSaveSceneMessage(ctx: ExtendedWizardContext, msg?: Message | Message[]) {
        if (ctx.scene.session.state.sceneMessageIds === undefined)
            ctx.scene.session.state.sceneMessageIds = [];

        if (msg) {
            if (Array.isArray(msg))
                ctx.scene.session.state.sceneMessageIds = ctx.scene.session.state.sceneMessageIds.concat(
                    msg.map(x => x.message_id)
                );
            else ctx.scene.session.state.sceneMessageIds.push(msg.message_id);
        }
    }

    async executeCurrentStep<C extends ExtendedWizardContext>(ctx: C) {
        const step = ctx.wizard.step;
        if (!step) return;

        const stepFn =
            typeof ctx.wizard.step === "function"
                ? (step as MiddlewareFn<C>)
                : (step as MiddlewareObj<C>).middleware();
        await stepFn(ctx, () => Promise.resolve());
    }
}
