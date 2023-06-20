import { Octokit, type OctokitOptions } from "@ijsblokje/octokit";
import { InstallationManager } from "./managers/InstallationManager.js";
import { createClient } from "redis";
import SmeeClient from "smee-client";

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

	public async start(port: number, smeeUrl?: string): Promise<void> {
		await this.installations.loadAll();
		// TODO: start express server
		if (smeeUrl) {
			const smee = new SmeeClient({
				target: `http://localhost:${port}/events`,
				source: smeeUrl,
				logger: console
			});

			smee.start();
		}
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
