import { ApplyOptions, GitHubEvent, GitHubInstallation } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";
import { README_CONFIG_LOCATION } from "@ijsblokje/utils/constants.js";
import { ReadmeSync } from "../index.js";

@ApplyOptions({ event: "repository" })
export default class extends GitHubEvent {
	public override async run(
		event: EmitterWebhookEvent<"repository.created" | "repository.deleted" | "repository.transferred">,
		octokit: Octokit,
		installation?: GitHubInstallation
	) {
		if (!installation || !["created", "deleted", "transferred"].includes(event.payload.action)) return;
		if (event.payload.action === "created") {
			const config = await this.getRepositoryConfig(octokit, installation.name, event.payload.repository.name);
			installation.configs.set(event.payload.repository.name, config ? ReadmeSync.getConfig(event.payload.repository as any, config) : null);

			return;
		}

		installation.configs.delete(event.payload.repository.name);
	}

	/**
	 * Fetches the repository readme config
	 * @param token The installation access token
	 * @param owner The repository owner
	 * @param repo The repository name
	 * @param ref The ref you want to get the content from
	 * @returns
	 */
	public async getRepositoryConfig(octokit: Octokit, owner: string, repo: string) {
		try {
			const data = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
				path: README_CONFIG_LOCATION,
				owner,
				repo
			});

			return "content" in data.data ? Buffer.from(data.data.content, "base64").toString() : null;
		} catch (error) {
			return null;
		}
	}
}
