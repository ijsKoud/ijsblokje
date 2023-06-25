import { ApplyOptions, GitHubEvent, GitHubInstallation } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";
import { Commit } from "@ijsblokje/release";

@ApplyOptions({ event: "issues" })
export default class extends GitHubEvent {
	public override async run(event: EmitterWebhookEvent<"issues.opened" | "issues.edited">, octokit: Octokit, installation?: GitHubInstallation) {
		const parsedTitle = new Commit({ commit: { message: event.payload.issue.title } } as any).parse();
		if (!parsedTitle || !installation) return;

		const defaultLabels = installation.defaultLabels.filter((label) => label.name.toLowerCase().includes(parsedTitle.type));
		const repoLabels = (installation.labels.get(event.payload.repository.name) ?? []).filter((label) =>
			label.name.toLowerCase().includes(parsedTitle.type)
		);
		const currentLabels = (event.payload.issue.labels ?? []).filter((label) => label.name.toLowerCase().includes("merge"));

		await octokit
			.request("PUT /repos/{owner}/{repo}/issues/{issue_number}/labels", {
				issue_number: event.payload.issue.number,
				owner: installation.name,
				repo: event.payload.repository.name,
				labels: [
					...defaultLabels.map((label) => label.name),
					...repoLabels.map((label) => label.name),
					...currentLabels.map((label) => label.name)
				]
			})
			.catch(() => void 0);
	}
}
