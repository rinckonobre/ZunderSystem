import config from "./settings/config.json";
export * from "colors";

import { ExtendedClient } from "./app/base";
import { Database } from "./app/classes";

const client = new ExtendedClient();
client.start();

const db = {
	players: new Database("players"),
	guilds: new Database("guilds"),
	resources: new Database("resources")
};

export { client, config, db };
