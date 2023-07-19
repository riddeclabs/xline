import { DataSource } from "typeorm";

import entities from "./entities";
import migrations from "./migrations";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require("dotenv");

export { entities, migrations };

dotenv.config();

// ts-unused-exports:disable-next-line
export default new DataSource({
    type: "postgres",
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT)!,
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    entities,
    migrations,
});
