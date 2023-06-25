import { ApplyOptions, GitHubEvent, GitHubInstallation, ReadmeSync } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";
import { README_CONFIG_LOCATION } from "@ijsblokje/utils/constants.js";
import pushReadmeChanges from "./PushReadmeChanges.js";

@ApplyOptions({ event: "push" })
export default class extends GitHubEvent {
	public override async run(event: EmitterWebhookEvent<"push">, octokit: Octokit, installation?: GitHubInstallation) {
		if (!installation || !installation.readme) return;

		let config = installation.configs.get(event.payload.repository.name);
		const watched = [
			README_CONFIG_LOCATION,
			...(config ? Object.values(config.variables).filter((value) => typeof value === "string" && value.endsWith(".md")) : [])
		];

		const fileWasUpdated = event.payload.commits.some((commit) => {
			if (commit.added.some((file) => watched.includes(file))) return true;
			if (commit.modified.some((file) => watched.includes(file))) return true;
			if (commit.removed.some((file) => watched.includes(file))) return true;

			return false;
		});

		if (!fileWasUpdated) return;

		const repo = event.payload.repository.name;
		const owner = event.payload.repository.owner.login;
		if (!config) {
			const token = await octokit
				.request("POST /app/installations/{installation_id}/access_tokens", {
					installation_id: installation.installationId,
					permissions: { contents: "read" }
				})
				.catch(() => null);
			if (!token) return;

			const _config = await this.octocat.installations.getRepositoryConfig(token.data.token, owner, repo, event.payload.ref);
			if (!_config) return;

			config = ReadmeSync.getConfig(event.payload.repository as any, _config);
			if (event.payload.ref.endsWith("/main")) installation.configs.set(repo, config);
		}

		if (config) await pushReadmeChanges(event, config, octokit, installation);
	}
}
