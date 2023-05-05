import { Scenes } from "telegraf";
import { WizardSession, WizardSessionData } from "telegraf/typings/scenes";

export type DefaultSessionState = {
    sceneMessageIds?: number[];
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
