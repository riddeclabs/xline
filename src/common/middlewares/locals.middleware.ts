import { Request, Response, NextFunction } from "express";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pjson = require("../../../package.json");

export const bootstrapLocals = function (req: Request, res: Response, next: NextFunction) {
    res.locals.current_url = req.path;
    res.locals.version = pjson.version;
    res.locals.revision = process.env.VERSION ?? "local";
    next();
};
