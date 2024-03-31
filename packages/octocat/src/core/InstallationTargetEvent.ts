import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";

import type { GitHubInstallation } from "../index.js";
import { ApplyOptions, GitHubEvent } from "../index.js";

@ApplyOptions({ event: "installation_target.renamed" })
export default class extends GitHubEvent {
	public override run(event: EmitterWebhookEvent<"installation_target.renamed">, octokit: Octokit, installation?: GitHubInstallation) {
		const oldUsername = event.payload.changes.login?.from;
		if (!oldUsername) return;

		const newUsername = event.payload.account.login;
		if (!newUsername) return;

		if (!installation) return;
		installation.name = newUsername;
	}
}
