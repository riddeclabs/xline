import { MAIN_MENU_OPTIONS } from "./constants";
export const generateCBData = (type: MAIN_MENU_OPTIONS, data?: unknown): string => {
    return `${type}:${data}`;
};

export const parseCBData = (cb: string): { type: MAIN_MENU_OPTIONS; data: unknown } => {
    const [type, data] = cb.split(":");
    return {
        type: type as MAIN_MENU_OPTIONS,
        data,
    };
};

export const buildTypeExp = (type: MAIN_MENU_OPTIONS): RegExp => {
    return new RegExp(`^${type}.*$`);
};

export const concatArray = (arr: number[] | undefined, item: number | number[]): number[] => {
    if (arr) {
        if (Array.isArray(item)) {
            return [...arr, ...item];
        } else {
            return [...arr, item];
        }
    } else {
        if (Array.isArray(item)) {
            return item;
        } else {
            return [item];
        }
    }
};
