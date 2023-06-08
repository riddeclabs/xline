import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { BotCommonService } from "../../../bot-common.service";
import { CustomExceptionFilter } from "../../../exception-filter";
import { ExtendedSessionData, ExtendedWizardContext } from "../../../bot.types";
import { escapeSpecialCharacters } from "src/common";
import { Markup } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import { SignApplicationOptions } from "../../../constants";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "../../main.scene";
import * as filters from "telegraf/filters";
import { BorrowActionSteps, BorrowContext, BorrowReqCallbacks } from "./borrow.type";
import { BorrowTextSource } from "./borrow.text";

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(BorrowActionWizard.ID)
export class BorrowActionWizard {
    public static readonly ID = "BORROW_ACTION_WIZARD";

    constructor(private readonly botCommon: BotCommonService) {}

    @WizardStep(BorrowActionSteps.BORROW_TERMS)
    async onBorrowTerms(@Ctx() ctx: BorrowContext) {
        const maxCollateral = 80; //FIXME: get real data from the database
        const processingFee = 1; //FIXME: get real data from the database

        const msg = (await ctx.editMessageText(
            BorrowTextSource.getBorrowTermsText(maxCollateral, processingFee),
            {
                parse_mode: "MarkdownV2",
            }
        )) as Message;

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(
                [
                    {
                        text: "✅  Ok, let's proceed",
                        callback_data: `${BorrowReqCallbacks.APPROVE_TERMS}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                {
                    columns: 1,
                }
            ).reply_markup
        );
        ctx.scene.session.state.sceneEditMsgId = msg.message_id;
        ctx.wizard.next();
    }

    @WizardStep(BorrowActionSteps.AMOUNT_REQUEST)
    async onAmountRequest(@Ctx() ctx: BorrowContext) {
        const depositCrypto = 78.786; //FIXME: get real data from the database
        const depositFiat = 156000; //FIXME: get real data from the database
        const cryptoCurrency = "ETH"; //FIXME: get real data from the database
        const fiatCurrency = "USD"; //FIXME: get real data from the database
        const debtAmount = 96720; //FIXME: get real data from the database
        const utilizationRate = 62; //FIXME: get real data from the database
        const maxUtilizationRate = 80; //FIXME: get real data from the database
        const maxAllowedAmount = 28080; //FIXME: get real data from the database

        await ctx.editMessageText(
            BorrowTextSource.getAmountInputText(
                depositCrypto,
                depositFiat,
                cryptoCurrency,
                fiatCurrency,
                debtAmount,
                utilizationRate,
                maxUtilizationRate,
                maxAllowedAmount
            ),
            {
                parse_mode: "MarkdownV2",
            }
        );
        ctx.wizard.next();
    }

    @WizardStep(BorrowActionSteps.SIGN_TERMS)
    async onSignTerms(@Ctx() ctx: BorrowContext) {
        const depositCrypto = 78.786; //FIXME: get real data from the database
        const depositFiat = 156000; //FIXME: get real data from the database
        const cryptoCurrency = "ETH"; //FIXME: get real data from the database
        const fiatCurrency = "USD"; //FIXME: get real data from the database
        const debtAmountBefore = 96720; //FIXME: get real data from the database
        const utilizationRateBefore = 62; //FIXME: get real data from the database
        const debtAmountAfter = 111870; //FIXME: get real data from the database
        const utilizationRateAfter = 71.72; //FIXME: get real data from the database
        const liquidationRiskBefore = "LOW"; //FIXME: get real data from the database
        const liquidationRiskAfter = "MEDIUM"; //FIXME: get real data from the database
        const name = "John Doe"; //FIXME: get real data from the database
        const iban = "DE12345678901234567890"; //FIXME: get real data from the database

        const editMsgId = ctx.scene.session.state.sceneEditMsgId;
        const msg = (await ctx.telegram.editMessageText(
            ctx.chat?.id,
            editMsgId,
            undefined,
            BorrowTextSource.getSignTermsText(
                depositCrypto,
                depositFiat,
                cryptoCurrency,
                fiatCurrency,
                debtAmountBefore,
                utilizationRateBefore,
                debtAmountAfter,
                utilizationRateAfter,
                liquidationRiskBefore,
                liquidationRiskAfter,
                name,
                iban
            ),
            {
                parse_mode: "MarkdownV2",
            }
        )) as Message;

        await ctx.telegram.editMessageReplyMarkup(
            ctx.chat?.id,
            editMsgId,
            undefined,
            Markup.inlineKeyboard(
                [
                    {
                        text: "✅ Approve",
                        callback_data: `${BorrowReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
                    },
                    {
                        text: "❌ Disapprove",
                        callback_data: `${BorrowReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
                    },
                ],
                {
                    columns: 1,
                }
            ).reply_markup
        );
        ctx.scene.session.state.sceneEditMsgId = msg.message_id;
        ctx.wizard.next();
    }

    @Action(/.*/)
    async sceneActionHandler(@Ctx() ctx: BorrowContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == BorrowActionSteps.BORROW_TERMS) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case BorrowReqCallbacks.SIGN_APPLICATION:
                await this.signApplicationHandler(ctx, value);
                break;
            case BorrowReqCallbacks.APPROVE_TERMS:
                await this.approveTermsHandler(ctx, value);
                break;
            case BorrowReqCallbacks.BACK_TO_MAIN_MENU:
                await this.botCommon.tryToDeleteMessages(ctx, true);
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async userMessageHandler(@Ctx() ctx: BorrowContext) {
        // Catch user input to remove it with step message
        if (!ctx.has(filters.message("text"))) return;
        try {
            await ctx.deleteMessage(ctx.message.message_id);
        } catch {}

        const userMessageText = ctx.message.text;
        const currentCursor = ctx.scene.session.cursor;

        // We should to substitute 1 from current cursor,
        // due to each scene handler moves the pointer to the next scene
        switch (currentCursor - 1) {
            case BorrowActionSteps.AMOUNT_REQUEST:
                await this.reqAmountHandler(ctx, userMessageText);
                break;
            default:
                // Redirect to main scene if user input is "/start"
                if (ctx.message.text === "/start") {
                    await this.botCommon.tryToDeleteMessages(ctx, true);
                    await ctx.scene.enter(MainScene.ID);
                }
        }
    }

    private async signApplicationHandler(ctx: BorrowContext, callbackValue?: string) {
        if (callbackValue === SignApplicationOptions.APPROVE) {
            const name = "John Doe"; //FIXME: get real data from the database
            const iban = "DE12345678901234567890"; //FIXME: get real data from the database

            await ctx.editMessageText(BorrowTextSource.getBorrowSuccessText(name, iban), {
                parse_mode: "MarkdownV2",
            });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 }).reply_markup
            );
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            await ctx.editMessageText(BorrowTextSource.getBorrowDisapprovedText(), {
                parse_mode: "MarkdownV2",
            });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 }).reply_markup
            );
        } else {
            throw new Error("Incorrect sign application option");
        }
    }

    private async approveTermsHandler(ctx: BorrowContext, callbackValue?: string) {
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async reqAmountHandler(ctx: BorrowContext, userMessageText: string) {
        await this.botCommon.executeCurrentStep(ctx);
    }
}
