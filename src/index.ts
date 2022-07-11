import { config } from "dotenv";
config();

import { Probot, Server } from "probot";
import { LabelSync, Webhook } from "./handlers";
import { cleanEnv } from "./utils";

const getPort = () => {
	let port = Number(process.env.PORT);
	if (isNaN(port)) port = 3000;

	return port;
};

const server = new Server({
	Probot: Probot.defaults({
		port: getPort(),
		privateKey: cleanEnv("PRIVATE_KEY"),
		appId: process.env.APP_ID,
		secret: process.env.WEBHOOK_SECRET
	}),
	port: getPort(),
	webhookProxy: process.env.WEBHOOK_PROXY_URL
});

void (async () => {
	await server.load(LabelSync);
	await server.load(Webhook);
	await server.start();
})();
