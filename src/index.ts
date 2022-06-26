import { config } from "dotenv";
config();

import { Probot, Server } from "probot";
import { LabelSync } from "./handlers";

const getPort = () => {
	let port = Number(process.env.PORT);
	if (isNaN(port)) port = 3000;

	return port;
};

const getPrivateKey = () => {
	const key = process.env.PRIVATE_KEY ?? "";
	return key.replaceAll('"', "").replaceAll("\\n", "\n");
};

const server = new Server({
	Probot: Probot.defaults({
		port: getPort(),
		privateKey: getPrivateKey(),
		appId: process.env.APP_ID,
		secret: process.env.WEBHOOK_SECRET
	}),
	port: getPort(),
	webhookProxy: process.env.WEBHOOK_PROXY_URL
});

void (async () => {
	await server.load(LabelSync);
	await server.start();
})();
