export * from "colors";
import config from "./config.json";

import serviceAccount from './firebase.json';
import firebase, { credential, ServiceAccount } from 'firebase-admin';
firebase.initializeApp({ credential: credential.cert(serviceAccount as ServiceAccount) });

import { Database, ExtendedClient } from "./structs";

const client = new ExtendedClient();
client.start();

const db = {
	players: new Database("players"),
	guilds: new Database("guilds"),
	resources: new Database("resources")
}

export { db, client, config };