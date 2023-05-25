import { MAIN_MENU_OPTIONS } from "./constants";
export const generateCBData = (type: MAIN_MENU_OPTIONS, data?: unknown): string => {
    return `${type}:${data}`;
};

export const buildTypeExp = (type: MAIN_MENU_OPTIONS): RegExp => {
    return new RegExp(`^${type}.*$`);
};
