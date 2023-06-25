import { ApplyOptions, GitHubEvent, GitHubInstallation } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";
import pushReadmeChanges from "./PushReadmeChanges.js";

@ApplyOptions({ event: "repository" })
export default class extends GitHubEvent {
	public override async run(
		event: EmitterWebhookEvent<"repository.renamed" | "repository.edited">,
		octokit: Octokit,
		installation?: GitHubInstallation
	) {
		if (!installation || !installation.readme) return;
		if (!["renamed", "edited"].includes(event.payload.action)) return;

		const config = installation.configs.get(event.payload.repository.name);
		if (!config) return;

		config.repo.name = event.payload.repository.name;
		config.repo.description = event.payload.repository.description ?? "";

		if (event.payload.action === "renamed") installation.configs.delete(event.payload.changes.repository.name.from);
		installation.configs.set(event.payload.repository.name, config);

		await pushReadmeChanges(event, config, octokit, installation);
	}
}
