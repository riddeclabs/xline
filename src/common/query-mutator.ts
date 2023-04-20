import { stringify } from "qs";

export default function (query: Record<string, any>, overrideKey?: string, overrideValue?: string) {
    if (!overrideKey) {
        return stringify(query);
    }

    const res = { ...query };
    if (!overrideValue) {
        delete res[overrideKey];
    } else {
        res[overrideKey] = overrideValue;
    }

    return stringify(res);
}
