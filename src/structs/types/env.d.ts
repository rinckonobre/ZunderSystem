import { BotEnviroment } from "../ExtendedClient";

declare namespace NodeJS {
    interface ProcessEnv {
        ENV: BotEnviroment;
        DEV_BOT_TOKEN: string;
        DEV_MAIN_GUILD_ID: string;
        PROD_BOT_TOKEN: string;
        PROD_MAIN_GUILD_ID: string;
    }
}