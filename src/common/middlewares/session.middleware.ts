import { Logger } from "@nestjs/common";

import { Context } from "telegraf";
import { DataSourceOptions, DataSource } from "typeorm";

import { Session } from "../../database/entities";

type TSessionData = Record<string, unknown>;

const sessions: Record<number, TSessionData> = {};

export class UserSession {
    dataSource: DataSource | undefined = undefined;
    options: DataSourceOptions;

    constructor(options: DataSourceOptions) {
        this.options = options;
    }

    readonly getDataSource = (): DataSource => {
        if (!this.dataSource) {
            this.dataSource = new DataSource(this.options);
        }
        return this.dataSource;
    };

    getSessionKey(ctx: Context): number | undefined {
        // use from.id as a key since our bot working as private chat
        // chat.id === from.id
        if (!ctx.from) return;
        return ctx.from.id;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    findSession = (key: number): TSessionData | undefined => {
        if (sessions[key]) {
            return sessions[key];
        }
    };

    loadSession = async (key: number): Promise<TSessionData> => {
        const dataSource = this.getDataSource();
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        try {
            const SessionRepo = dataSource.getRepository(Session);
            let session = {};
            const existed = await SessionRepo.findOne({ where: { id: key } });
            if (existed) {
                session = existed.data;
            }
            sessions[key] = session;
            return session;
        } catch (e) {
            Logger.error("Error getting session", { e });
            const session = {};
            sessions[key] = session;
            return session;
        }
    };

    async getSession(key: number): Promise<TSessionData> {
        const cached = this.findSession(key);
        if (cached) return cached;
        return this.loadSession(key);
    }

    async saveSession(key: number, sessionData: TSessionData) {
        const dataSource = this.getDataSource();
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        const SessionRepo = dataSource.getRepository(Session);

        try {
            if (!sessionData || Object.keys(sessionData).length === 0) {
                await SessionRepo.delete({ id: key });
                return;
            }
            let session = await SessionRepo.findOne({ where: { id: key } });
            if (!session) {
                session = new Session();
                session.id = key;
            }
            session.data = sessionData;
            await SessionRepo.save(session);
            return;
        } catch (e) {
            Logger.error("Error saving session", { e });
            return;
        }
    }

    middleware() {
        return async (ctx: Context & { session: TSessionData }, next: () => Promise<void>) => {
            const key = this.getSessionKey(ctx);

            console.log("💋💋💋💋 MIDDLEWARE FUNCTION  💋💋💋💋");

            if (!key) {
                return next();
            }

            return this.getSession(key).then(async ses => {
                ctx.session = ses;
                await next();
                return await this.saveSession(key, ses);
            });
        };
    }
}
