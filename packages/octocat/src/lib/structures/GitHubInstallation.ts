import { Collection } from "@discordjs/collection";
import type { Octokit } from "@ijsblokje/octokit";
import type { Label } from "@ijsblokje/utils/types.js";
import { z } from "zod";

import type { InstallationManager, ListInstallationsItem } from "../managers/InstallationManager.js";
import { type ReadmeConfig, ReadmeSync } from "./ReadmeSync.js";

export class GitHubInstallation {
	/** The name of the account associated with this installation */
	public name: string;

	/** The installation id */
	public readonly installationId: number;

	/** Whether or not this installation is from a user or not */
	public readonly isUser: boolean;

	/** The labels config for specific repositories */
	public labels = new Collection<string, Label[]>();

	/** The default labels that apply to all repositories */
	public defaultLabels: Label[] = [];

	/** The readme sync instance */
	public readme: ReadmeSync | null;

	/** A map of readme configurations */
	public configs: Map<string, ReadmeConfig | null>;

	/** The installation Manager */
	public readonly manager: InstallationManager;

	/** The installation Manager */
	public readonly octokit: Octokit;

	public constructor(data: ListInstallationsItem, context: GitHubInstallationContext, configs: GitHubInstallation["configs"]) {
		if (!data.account || !("login" in data.account)) throw new Error("INVALID_INSTALLATION_DATA");

		this.name = data.account.login;
		this.installationId = data.id;
		this.isUser = data.account.type === "User";

		this.octokit = context.manager.octokit.new({ installationId: data.id });
		this.manager = context.manager;
		this.readme = context.readme ? new ReadmeSync(Buffer.from(context.readme, "base64").toString(), this.name) : null;

		this.configs = configs;

		if (context.labels) this.updateLabels(Buffer.from(context.labels, "base64").toString());
	}

	/**
	 * Updates the labels list and collection
	 * @param labels The label config
	 */
	public updateLabels(labels: string) {
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
