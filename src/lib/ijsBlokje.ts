import { Probot, Server } from "probot";
import { fileURLToPath } from "node:url";
import ActionHandler from "./Handlers/ActionHandler.js";
import { Logger } from "./Logger/Logger.js";
import { LogLevel } from "./Logger/LoggerTypes.js";
import { join } from "node:path";

const basePath = join(fileURLToPath(import.meta.url), "../../");

export default class ijsblokje {
	public probot: Server;
	public logger = new Logger({ level: this.loggerLevel });

	public ActionHandler = new ActionHandler(this, join(basePath, "actions"));

	private get port() {
		return Number(process.env.PORT) ?? 3000;
	}

	private get loggerLevel() {
		return process.env.NODE_ENV === "production" ? LogLevel.Debug : LogLevel.Info;
	}

	public constructor() {
		this.probot = new Server({
			Probot: Probot.defaults({
				port: this.port,
				privateKey: process.env.PRIVATE_KEY,
				appId: process.env.APP_ID,
				secret: process.env.WEBHOOK_SECRET
			}),
			port: this.port,
			webhookProxy: process.env.WEBHOOK_PROXY_URL
		});
	}

	public async start() {
		await this.ActionHandler.load();
		await this.probot.start();

		console.log(
			"actions",
			this.ActionHandler.actions,
			"gAccActions",
			this.ActionHandler.globalAccActions,
			"gRepoActions",
			this.ActionHandler.globalRepoActions,
			"gActions",
			this.ActionHandler.globalActions
		);
		this.probot.probotApp.onError((err) => this.logger.error(`[PROBOT]: WebhookHandler error ->`, err));
	}
}
