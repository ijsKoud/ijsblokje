import type { Octokit } from "@ijsblokje/octokit";
import type { Octocat } from "../Octocat.js";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { glob } from "glob";
import { Collection } from "@discordjs/collection";
import { GitHubEvent } from "../structures/GithubEvent.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export class EventManager {
	/** The octocat instance */
	public readonly octocat: Octocat;

	/** The octokit instance */
	public readonly octokit: Octokit;

	/** A collection of all the loaded events */
	public events = new Collection<string, GitHubEvent<any>>();

	/** The base directory where all event handlers are located */
	private readonly directory: string;

	/**
	 * @param octocat The octokit instance
	 * @param directory The base directory where all the event handlers are located
	 */
	public constructor(octocat: Octocat, directory: string) {
		this.octocat = octocat;
		this.octokit = octocat.octokit;
		this.directory = directory;
	}

	/** Loads all the event handlers */
	public async loadAll() {
		const coreDirectory = join(__dirname, "..", "..", "core");
		const coreFiles = await this.getFiles(coreDirectory);
		const externalFiles = await this.getFiles(this.directory);
		const files = [...externalFiles, ...coreFiles];

		await Promise.all(files.map(this.load.bind(this)));
	}

	/**
	 * Loads an event handler file
	 * @param path The path to the event handler
	 */
	public async load(path: string) {
		const { default: construct } = await import(path);
		if (typeof construct === "function" && typeof construct.prototype === "object") {
			const event = new construct();
			if (!(event instanceof GitHubEvent)) return;

			this.events.set(event.event, event);
			this.octocat.server.on(event.event, (data) => this.handleEvent(data, event));
			event.load(this.octocat);
		}
	}

	private handleEvent(event: any, handler: GitHubEvent<any>) {
		const installationId = event.payload.installation.id;
		const installation = this.octocat.installations.cache.get(installationId);
		if (!installation) return;

		void handler.run(event, installation);
	}

	/**
	 * Returns a list of JavaScript file paths from a provided directory
	 * @param directory The directory to read
	 */
	private async getFiles(directory: string) {
		const files = await glob("**/*.js", { cwd: directory, nodir: true, withFileTypes: true });
		return files.map((path) => path.fullpath());
	}
}
