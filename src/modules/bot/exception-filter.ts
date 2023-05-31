import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import { BotCommonService } from "./bot-common.service";
import { TelegrafArgumentsHost } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { ExtendedWizardContext } from "./bot.types";

@Catch()
export class CustomExceptionFilter<D extends ExtendedWizardContext> implements ExceptionFilter {
    constructor(private readonly botCommon: BotCommonService) {}

    async catch(exception: Error, host: ArgumentsHost): Promise<void> {
        const logger = new Logger();

        const telegrafHost = TelegrafArgumentsHost.create(host);
        const ctx = telegrafHost.getContext<D>();

        await this.botCommon.tryToDeleteMessages(ctx, true);

        logger.error(exception, "State: " + JSON.stringify(ctx.session));

        await ctx.reply(
            "🤷 Whoops. Something went wrong \n" + "Try to start this action from scratch",
            Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 })
        );
    }
}
