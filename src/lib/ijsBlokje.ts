import { Probot, ProbotOctokit, Server } from "probot";
import { getProbotOctokitWithDefaults } from "probot/lib/octokit/get-probot-octokit-with-defaults.js";
import { fileURLToPath } from "node:url";
import ActionHandler from "./Handlers/ActionHandler.js";
import { Logger } from "./Logger/Logger.js";
import { LogLevel } from "./Logger/LoggerTypes.js";
import { join } from "node:path";
import lruCache from "lru-cache";
import DataHandler from "./Handlers/DataHandler.js";

const basePath = join(fileURLToPath(import.meta.url), "../../");

export default class ijsblokje {
	public probot: Server;
	public logger = new Logger({ level: this.loggerLevel });

	public ActionHandler = new ActionHandler(this, join(basePath, "actions"));
	public DataHandler = new DataHandler(this);

	public allowedInstallations: string[] = [];

	public get octokit() {
		const cache = new lruCache<number, string>({
			max: 15e3,
			maxAge: 1e3 * 60 * 59
		});

		const OctoKit = getProbotOctokitWithDefaults({
			cache,
			log: this.probot.log,
			Octokit: ProbotOctokit,
			appId: Number(process.env.APP_ID),
			privateKey: process.env.PRIVATE_KEY
		});

		return new OctoKit();
	}

	private get port() {
		return Number(process.env.PORT) ?? 3000;
	}

	private get loggerLevel() {
		return process.env.NODE_ENV === "production" ? LogLevel.Info : LogLevel.Debug;
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

		this.allowedInstallations = (process.env.ALLOWED_INSTALLATIONS ?? "").split(",");
	}

	public async start() {
		await this.ActionHandler.load();
		await this.probot.start();

		await this.DataHandler.start();

		this.probot.probotApp.onAny((ev) => this.ActionHandler.onPayloadReceived(ev));
		this.probot.probotApp.onError((err) => this.logger.error(`[PROBOT]: WebhookHandler error ->`, err));
	}
}
