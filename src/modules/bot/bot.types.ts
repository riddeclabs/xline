import { Scenes } from "telegraf";
import { WizardSession, WizardSessionData } from "telegraf/typings/scenes";
import { InlineKeyboardButton } from "typegram/markup";

export type DefaultSessionState = {
    sceneMessageIds?: number[];
    skipMsgRemovingOnce?: number[];
    sceneEditMsgId?: number;
};

export type ExtendedSessionData = WizardSessionData & {
    state: DefaultSessionState;
};

export type ExtendedWizardContext<D extends ExtendedSessionData = ExtendedSessionData> =
    Scenes.WizardContext<D> & {
        session: WizardSession & {
            // Custom field that used to transfer data between scenes
            targetCurrency: string;
        };
    };

export type CallbackButton = InlineKeyboardButton.CallbackButton;
export type UrlButton = InlineKeyboardButton.UrlButton;
