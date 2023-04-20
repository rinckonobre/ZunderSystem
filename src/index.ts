import firebase, { credential, ServiceAccount } from 'firebase-admin';
export * from "colors";
import dotenv from "dotenv";
import config from "./config/config.json";
dotenv.config()

const enviroment = process.env.ENV as BotEnviroment;

import devFirestoreAccount from "./config/development/firebase.json";
import prodFirestoreAccount from "./config/production/firebase.json";

if (enviroment == "development"){
	firebase.initializeApp({ credential: credential.cert(devFirestoreAccount as ServiceAccount) });
} else {
	firebase.initializeApp({ credential: credential.cert(prodFirestoreAccount as ServiceAccount) });
}

import { BotEnviroment, Database, ExtendedClient } from './app/structs';

const client = new ExtendedClient({enviroment});
client.start();

const db = {
	players: new Database("players"),
	guilds: new Database("guilds"),
	resources: new Database("resources")
}

export { db, client, config };