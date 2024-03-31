import type { GitHubInstallation } from "@ijsblokje/octocat";
import { ApplyOptions, GitHubEvent } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import { Commit } from "@ijsblokje/release";
import type { EmitterWebhookEvent } from "@ijsblokje/server";

@ApplyOptions({ event: "pull_request" })
export default class extends GitHubEvent {
	public override async run(
		event: EmitterWebhookEvent<"pull_request.opened" | "pull_request.edited">,
		octokit: Octokit,
		installation?: GitHubInstallation
	) {
		const parsedTitle = new Commit({ commit: { message: event.payload.pull_request.title } } as any).parse();
		if (!parsedTitle || !installation) return;

		const defaultLabels = installation.defaultLabels.filter((label) => label.name.toLowerCase().includes(parsedTitle.type));
		const repoLabels = (installation.labels.get(event.payload.repository.name) ?? []).filter((label) =>
			label.name.toLowerCase().includes(parsedTitle.type)
		);
		const currentLabels = (event.payload.pull_request.labels ?? []).filter((label) => label.name.toLowerCase().includes("merge"));

		if (event.payload.pull_request.user.login === "renovate[bot]") {
			const dependencyLabel = installation.defaultLabels.find((label) => label.name.toLowerCase().includes("dependencies"));
			if (dependencyLabel) defaultLabels.push(dependencyLabel);
		}

		await octokit
			.request("PUT /repos/{owner}/{repo}/issues/{issue_number}/labels", {
				issue_number: event.payload.pull_request.number,
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
