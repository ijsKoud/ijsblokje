import { Octokit } from "@ijsblokje/octokit";
import { InstallationManager } from "./managers/InstallationManager.js";
import { createClient } from "redis";
import { Server, WebsocketServer } from "@ijsblokje/server";
import { EventManager } from "./managers/EventManager.js";
import { Logger } from "@snowcrystals/icicle";
import { DurationFormatter } from "@sapphire/duration";
import requestWithPagination from "@ijsblokje/utils/RequestWithPagination.js";
import { Commit, VersionBump } from "@ijsblokje/release";

export class Octocat {
	public readonly installations: InstallationManager;
	public readonly events: EventManager;

	/** The octokit instance that handles all GitHub requests */
	public readonly octokit: Octokit;

	/** The redis instance */
	public readonly redis: ReturnType<typeof createClient>;

	/** The server handling the incoming GitHub event data */
	public server!: Server;

	public websocket = new WebsocketServer();

	public logger = new Logger({ name: "Octocat" });

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
		const start = performance.now();
		const server = new Server({ secret, urlOrPort });

		this.server = server;
		this.websocket.getVersion = this.getProposedVersion.bind(this);

		await this.installations.loadAll();
		await this.events.loadAll();

		const end = performance.now();
		const formatter = new DurationFormatter();
		this.logger.info(`Octocat is ready! Startup took ${formatter.format(end - start, 4)}`);
	}

	private async getProposedVersion(owner: string, repo: string): Promise<string | null | undefined> {
		const installation = this.installations.cache.find((installation) => installation.name.toLowerCase() === owner);
		if (!installation || !installation.configs.has(repo)) return undefined;

		try {
			const latestRelease = await installation.octokit.request("GET /repos/{owner}/{repo}/releases/latest", { owner, repo });
			const request = (page: number) =>
				installation.octokit
					.request("GET /repos/{owner}/{repo}/compare/{base}...{head}", {
						owner,
						repo,
						page,
						per_page: 100,
						base: latestRelease.data.tag_name,
						head: "main"
					})
					.then((res) => res.data.commits);
			const compareData = await requestWithPagination(request, (data) => data.length === 100);
			const commits = compareData.reduce((a, b) => [...a, ...b]).map((commit) => new Commit(commit));
			const version = latestRelease.data.tag_name.slice(1);

			const newVersion = VersionBump.getNewVersion(commits, version);
			return newVersion;
		} catch (error) {
			console.log(error);
			return null;
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

	/** The base directory where all the event handlers are located */
	eventsDirectory: string;

	/** A list of account names which are allowed to be loaded */
	allowedInstallations?: string[];
}
