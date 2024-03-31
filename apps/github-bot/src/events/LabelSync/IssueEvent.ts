import type { GitHubInstallation } from "@ijsblokje/octocat";
import { ApplyOptions, GitHubEvent } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import { Commit } from "@ijsblokje/release";
import type { EmitterWebhookEvent } from "@ijsblokje/server";

@ApplyOptions({ event: "issues" })
export default class extends GitHubEvent {
	public override async run(event: EmitterWebhookEvent<"issues.opened" | "issues.edited">, octokit: Octokit, installation?: GitHubInstallation) {
		const parsedTitle = new Commit({ commit: { message: event.payload.issue.title } } as any).parse();
		if (!parsedTitle || !installation) return;

		const defaultLabels = installation.defaultLabels.filter((label) => label.name.toLowerCase().includes(parsedTitle.type));
		const repositoryLabels = installation.labels.get(event.payload.repository.name) ?? [];
		const repoLabels = repositoryLabels.filter((label) => label.name.toLowerCase().includes(parsedTitle.type));

		await octokit
			.request("PUT /repos/{owner}/{repo}/issues/{issue_number}/labels", {
				issue_number: event.payload.issue.number,
				owner: installation.name,
				repo: event.payload.repository.name,
				labels: [...defaultLabels.map((label) => label.name), ...repoLabels.map((label) => label.name)]
			})
			.catch(() => void 0);
	}
}
