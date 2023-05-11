import config from "./settings/config.json";
import dotenv from "dotenv";
export * from "colors";
dotenv.config();

// import firebase, { credential, ServiceAccount } from "firebase-admin";
// const enviroment = process.env.ENV as "Development" | "Production";

// import devFirestoreAccount from "./config/development/firebase.json";
// import prodFirestoreAccount from "./config/production/firebase.json";

// if (enviroment == "Development"){
// 	firebase.initializeApp({ credential: credential.cert(devFirestoreAccount as ServiceAccount) });
// } else {
// 	firebase.initializeApp({ credential: credential.cert(prodFirestoreAccount as ServiceAccount) });
// }

// import { ExtendedClient } from "./app";
import { ExtendedClient } from "./app/base";
import { Database } from "./app/classes";

const client = new ExtendedClient();
client.start();

const db = {
	players: new Database("players"),
	guilds: new Database("guilds"),
	resources: new Database("resources")
};

export { db, client, config };

