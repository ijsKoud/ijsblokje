import { Octokit } from "@ijsblokje/octokit";
import { InstallationManager } from "./managers/InstallationManager.js";
import { createClient } from "redis";
import { Server } from "@ijsblokje/server";
import { EventManager } from "./managers/EventManager.js";
import { Logger } from "@snowcrystals/icicle";

export class Octocat {
	public readonly installations: InstallationManager;
	public readonly events: EventManager;

	/** The octokit instance that handles all GitHub requests */
	public readonly octokit: Octokit;

	/** The redis instance */
	public readonly redis: ReturnType<typeof createClient>;

	/** The server handling the incoming GitHub event data */
	public server!: Server;

	public constructor(options: OctocatOptions) {
		this.redis = createClient({ url: options.redisUrl });
		this.octokit = new Octokit({
			appId: options.appId,
			privateKey: options.privateKey,
			clientId: options.clientId,
			clientSecret: options.clientSecret,
			logger: new Logger({ name: "Octokit" })
		});

		this.installations = new InstallationManager(this, options.allowedInstallations);
		this.events = new EventManager(this, options.eventsDirectory);
	}

	/**
	 * Starts the GitHub bot and opens the webhook connection
	 * @param urlOrPort The url or port to listen to
	 * @example urlOrPort: "https://smee.io/xxxxxxx"
	 * @param secret The webhook secret
	 */
	public async start(urlOrPort: string | number, secret: string): Promise<void> {
		const server = new Server({ secret, urlOrPort });
		this.server = server;

		await this.installations.loadAll();
		await this.events.loadAll();
	}
}

export interface OctocatOptions {
	/** The private key to sign data */
	privateKey: string;

	/** The id of the GitHub application */
	appId: number;

	/** The GitHub client id */
	clientId: string;

	/** The GitHub client secret */
	clientSecret: string;

	/** The Redis database url */
	redisUrl: string;

	/** The base directory where all the event handlers are located */
	eventsDirectory: string;

	/** A list of account names which are allowed to be loaded */
	allowedInstallations?: string[];
}
