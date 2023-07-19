import { Scenes } from "telegraf";
import { WizardSession, WizardSessionData } from "telegraf/typings/scenes";
import { InlineKeyboardButton } from "typegram/markup";
import { CollateralCurrency, DebtCurrency } from "../../database/entities";

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
            sceneTransferObject?: SceneTransferObject;
        };
    };

type SceneTransferObject = {
    creditLineData?: CreditLineSceneData;
};

export type CreditLineSceneData = {
    creditLineId?: number;
    collateralCurrency?: CollateralCurrency;
    debtCurrency?: DebtCurrency;
};

export type CallbackButton = InlineKeyboardButton.CallbackButton;
export type UrlButton = InlineKeyboardButton.UrlButton;
