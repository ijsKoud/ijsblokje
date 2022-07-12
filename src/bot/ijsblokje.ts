import { Probot, Server } from "probot";
import { cleanEnv, getPort } from "../lib";
import LoadAll from "./github";

export class Ijsblokje {
	public probot: Server;

	public constructor() {
		this.probot = new Server({
			Probot: Probot.defaults({
				port: getPort(),
				privateKey: cleanEnv("PRIVATE_KEY"),
				appId: process.env.APP_ID,
				secret: process.env.WEBHOOK_SECRET
			}),
			port: getPort(),
			webhookProxy: process.env.WEBHOOK_PROXY_URL
		});
	}

	public async start() {
		await LoadAll(this.probot.probotApp);
		await this.probot.start();
	}
}
