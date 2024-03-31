import type { GitHubInstallation } from "@ijsblokje/octocat";
import { ApplyOptions, GitHubEvent } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";

import { CreateLabel, DeleteLabel } from "./LabelSyncUtils.js";

@ApplyOptions({ event: "repository.created" })
export default class extends GitHubEvent {
	public override async run(event: EmitterWebhookEvent<"repository.created">, octokit: Octokit, installation?: GitHubInstallation) {
		if (!installation || !installation.defaultLabels) return;
		const repoLabels = installation.labels.get(event.payload.repository.name) ?? [];
		const labels = [...installation.defaultLabels, ...repoLabels];

		const owner = installation.name;
		const repo = event.payload.repository.name;

		const existingLabels = await octokit.request("GET /repos/{owner}/{repo}/labels", { owner, repo }).catch(() => null);
		if (existingLabels) await Promise.all(existingLabels.data.map((label) => DeleteLabel(octokit, label.name, owner, repo)));

		await Promise.all(labels.map((label) => CreateLabel(octokit, label.name, label.color, label.description, owner, repo)));
	}
}
