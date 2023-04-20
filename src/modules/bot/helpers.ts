import { EVENT_TYPES } from "./constants";
export const generateCBData = (type: EVENT_TYPES, data?: unknown): string => {
    return `${type}:${data}`;
};

export const parseCBData = (cb: string): { type: EVENT_TYPES; data: unknown } => {
    const [type, data] = cb.split(":");
    return {
        type: type as EVENT_TYPES,
        data,
    };
};

export const buildTypeExp = (type: EVENT_TYPES): RegExp => {
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
