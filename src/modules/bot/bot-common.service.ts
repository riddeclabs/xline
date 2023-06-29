import { Injectable } from "@nestjs/common";
import { LEFT_INDENT_BD_S, MAIN_MENU_OPTIONS, RIGHT_INDENT_BD_S } from "./constants";
import { generateCBData } from "./helpers";
import { Ctx } from "nestjs-telegraf";
import { CallbackButton, CreditLineSceneData, ExtendedWizardContext, UrlButton } from "./bot.types";
import { Message } from "typegram";
import { Markup, MiddlewareFn, MiddlewareObj } from "telegraf";
import { InlineKeyboardButton } from "typegram/markup";
import { CollateralCurrency, DebtCurrency } from "../../database/entities";

@Injectable()
export class BotCommonService {
    goBackButton(): CallbackButton {
        return {
            text: "↩ Go to main menu",
            callback_data: generateCBData(MAIN_MENU_OPTIONS.BACK_MAIN_MENU),
        };
    }

    async tryToDeleteMessages(@Ctx() ctx: ExtendedWizardContext, forceDelete = false) {
        const csss = ctx.scene.session.state;
        const allMessageIds = csss.sceneMessageIds;
        const allSkipMessageIds = forceDelete ? undefined : csss.skipMsgRemovingOnce;

        if (allMessageIds) {
            const deleteMessageIds =
                !forceDelete && allSkipMessageIds
                    ? allMessageIds.filter(value => !allSkipMessageIds.includes(value))
                    : allMessageIds;

            try {
                await Promise.all(
                    deleteMessageIds.map((message_id: number) => {
                        return ctx.deleteMessage(message_id);
                    })
                );
            } catch (e) {
                // in case target message was deleted previously
            }

            // Clean up all messages
            ctx.scene.session.state.sceneMessageIds = allSkipMessageIds ?? [];
            ctx.scene.session.state.skipMsgRemovingOnce = [];
        }

        if (forceDelete && csss.sceneEditMsgId)
            try {
                await ctx.deleteMessage(csss.sceneEditMsgId);
            } catch (e) {}

        try {
            await ctx.deleteMessage();
        } catch (e) {}
    }

    // Sends a new message and immediately remove all previous messages from chat
    async clearAndReply(
        ctx: ExtendedWizardContext,
        msgText: string,
        isMarkdown = false,
        options = { columns: 1 },
        buttons?: InlineKeyboardButton[]
    ): Promise<Message> {
        let msg;
        if (!isMarkdown) {
            msg = ctx.reply(msgText, buttons ? Markup.inlineKeyboard(buttons, options) : undefined);
        } else {
            msg = ctx.replyWithMarkdownV2(
                msgText,
                buttons ? Markup.inlineKeyboard(buttons, options) : undefined
            );
        }
        await this.tryToDeleteMessages(ctx);

        return msg;
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

    skipMessageRemoving(ctx: ExtendedWizardContext, msg?: Message | Message[]) {
        const skipMsgs = new Set<number>(ctx.scene.session.state.skipMsgRemovingOnce ?? []);
        if (msg) {
            const msgArray = Array.isArray(msg) ? msg : [msg];
            for (const msg of msgArray) {
                skipMsgs.add(msg.message_id);
            }
        }
        ctx.scene.session.state.skipMsgRemovingOnce = Array.from(skipMsgs);
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

    updateSceneCreditLineDto(ctx: ExtendedWizardContext, scenePartialDto: Partial<CreditLineSceneData>) {
        const currentSceneDto = ctx.session.sceneTransferObject;
        ctx.session.sceneTransferObject = {
            creditLineData: {
                ...currentSceneDto?.creditLineData,
                ...(scenePartialDto.creditLineId && {
                    creditLineId: scenePartialDto.creditLineId,
                }),
                ...(scenePartialDto.collateralCurrency && {
                    collateralCurrency: scenePartialDto.collateralCurrency,
                }),
                ...(scenePartialDto.debtCurrency && {
                    debtCurrency: scenePartialDto.debtCurrency,
                }),
            },
        };
    }

    getCreditLineIdFromSceneDto(ctx: ExtendedWizardContext) {
        const clId = ctx.session.sceneTransferObject?.creditLineData?.creditLineId;
        if (!clId) throw new Error("creditLineId is missed in scene DTO");
        return clId;
    }

    getCollateralCurrencyFromSceneDto(ctx: ExtendedWizardContext): CollateralCurrency {
        const clCollateralCurrency = ctx.session.sceneTransferObject?.creditLineData?.collateralCurrency;
        if (!clCollateralCurrency) throw new Error("CollateralCurrency is missed in scene DTO");
        return clCollateralCurrency;
    }

    getDebtCurrencyFromSceneDto(ctx: ExtendedWizardContext): DebtCurrency {
        const clDebtCurrency = ctx.session.sceneTransferObject?.creditLineData?.debtCurrency;
        if (!clDebtCurrency) throw new Error("DebtCurrency is missed in scene DTO");
        return clDebtCurrency;
    }

    clearSceneDto(ctx: ExtendedWizardContext) {
        ctx.session.sceneTransferObject = {};
    }

    makeHeaderText(origText: string): string {
        return LEFT_INDENT_BD_S + `*${origText}*` + RIGHT_INDENT_BD_S;
    }

    getMetamaskWalletButton(wallet: string): UrlButton {
        return {
            text: "🦊 Open metamask wallet",
            url: `https://metamask.app.link/send/pay-${wallet}`,
        };
    }

    async retryOrBackHandler(ctx: ExtendedWizardContext, errorMsg: string, retryCallbackValue: string) {
        const editMsgId = ctx.scene.session.state.sceneEditMsgId;
        await ctx.telegram.editMessageText(ctx.chat?.id, editMsgId, undefined, errorMsg, {
            parse_mode: "MarkdownV2",
        });
        await ctx.telegram.editMessageReplyMarkup(
            ctx.chat?.id,
            editMsgId,
            undefined,
            Markup.inlineKeyboard(
                [
                    {
                        text: "🔄 Try again",
                        callback_data: `${retryCallbackValue}`,
                    },
                    this.goBackButton(),
                ],
                { columns: 2 }
            ).reply_markup
        );
    }
}
