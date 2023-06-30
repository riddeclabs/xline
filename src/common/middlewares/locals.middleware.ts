import { Request, Response, NextFunction } from "express";
import * as process from "process";

export const bootstrapLocals = function (req: Request, res: Response, next: NextFunction) {
    res.locals.current_url = req.path;
    res.locals.version = process.env.npm_package_version;
    res.locals.revision = process.env.VERSION ?? "local";
    next();
};
