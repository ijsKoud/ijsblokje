import type { InstallationManager, ListInstallationsItem } from "../managers/InstallationManager.js";
import { Collection } from "@discordjs/collection";
import type { Label } from "@ijsblokje/utils/types.js";
import type { Octokit } from "@ijsblokje/octokit";
import { z } from "zod";

export class GitHubInstallation {
	/** The name of the account associated with this installation */
	public name: string;

	/** The installation id */
	public readonly installationId: number;

	/** Whether or not this installation is from a user or not */
	public readonly isUser: boolean;

	/** The readme template from the readme repository of this account */
	public readme: string | null;

	/** The labels config for specific repositories */
	public labels = new Collection<string, Label[]>();

	/** The default labels that apply to all repositories */
	public defaultLabels: Label[] = [];

	/** The installation Manager */
	public readonly manager: InstallationManager;

	/** The installation Manager */
	public readonly octokit: Octokit;

	public constructor(data: ListInstallationsItem, context: GitHubInstallationContext) {
		if (!data.account || !("login" in data.account)) throw new Error("INVALID_INSTALLATION_DATA");

		this.name = data.account.login;
		this.installationId = data.id;
		this.isUser = data.account.type === "User";

		this.octokit = context.manager.octokit.new({ installationId: data.id });
		this.manager = context.manager;
		this.readme = context.readme ? Buffer.from(context.readme, "base64").toString() : null;

		if (context.labels) this._parseLabels(Buffer.from(context.labels, "base64").toString());
	}

	private _parseLabels(labels: string) {
		try {
			const label = z.object({
				name: z.string().max(100),
				description: z.string().max(100),
				color: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/g, "color is not in hex format")
			});

			const schema = z.object({
				labels: z.array(label),
				repositories: z.record(z.string(), z.array(label)).optional()
			});

			const parsed = schema.parse(JSON.parse(labels));
			if (parsed.repositories) Object.keys(parsed.repositories).forEach((key) => this.labels.set(key, parsed.repositories![key]));
			this.defaultLabels.push(...parsed.labels);
		} catch (error) {}
	}
}

export interface GitHubInstallationContext {
	/** The installation Manager initiating the constructor */
	manager: InstallationManager;

	/** The readme template from the readme repository */
	readme: string | null;

	/** The labels config from the readme repository */
	labels: string | null;
}
