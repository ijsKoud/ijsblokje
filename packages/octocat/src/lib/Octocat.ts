import { Octokit, type OctokitOptions } from "@ijsblokje/octokit";
import { InstallationManager } from "./managers/InstallationManager.js";
import { createClient } from "redis";
import { Server } from "@ijsblokje/server";

export class Octocat {
	public readonly installations: InstallationManager;

	/** The octokit instance that handles all GitHub requests */
	public readonly octokit: Octokit;

	/** The redis instance */
	public readonly redis: OctokitOptions["redis"];

	public constructor(options: OctocatOptions) {
		this.redis = createClient({ url: options.redisUrl });
		this.octokit = new Octokit({
			appId: options.appId,
			privateKey: options.privateKey,
			clientId: options.clientId,
			clientSecret: options.clientSecret,
			redis: this.redis
		});

		this.installations = new InstallationManager(this.octokit);
	}

	/**
	 * Starts the GitHub bot and opens the webhook connection
	 * @param urlOrPort The url or port to listen to
	 * @example urlOrPort: "https://smee.io/xxxxxxx"
	 * @param secret The webhook secret
	 */
	public async start(urlOrPort: string | number, secret: string): Promise<void> {
		await this.installations.loadAll();
		const server = new Server({ secret, urlOrPort });
		server;
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
}
