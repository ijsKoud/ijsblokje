import { ApplyOptions, GitHubEvent, GitHubInstallation } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";
import { README_CONFIG_LOCATION } from "@ijsblokje/utils/constants.js";

@ApplyOptions({ event: "push" })
export default class extends GitHubEvent {
	public override async run(event: EmitterWebhookEvent<"push">, octokit: Octokit, installation?: GitHubInstallation) {
		if (!installation || !installation.readme) return;

		const config = installation.configs.get(event.payload.repository.name);
		if (!config) return;

		const watched = [README_CONFIG_LOCATION, ...Object.values(config.variables).filter((value) => value.endsWith(".md"))];
		const fileWasUpdated = event.payload.commits.some((commit) => {
			if (commit.added.some((file) => watched.includes(file))) return true;
			if (commit.modified.some((file) => watched.includes(file))) return true;
			if (commit.removed.some((file) => watched.includes(file))) return true;

			return false;
		});

		if (!fileWasUpdated) return;
		const repo = event.payload.repository.name;
		const owner = event.payload.repository.owner.login;

		const content = await installation.readme.generate(config, octokit, event.payload.repository.name);
		const ref = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", { owner, repo, ref: event.payload.ref });
		const currentSha = ref.data.object.sha;

		const latestCommit = await octokit.request("GET /repos/{owner}/{repo}/git/commits/{commit_sha}", { owner, repo, commit_sha: currentSha });
		const treeSha = latestCommit.data.tree.sha;

		const blob = await octokit.request("POST /repos/{owner}/{repo}/git/blobs", { owner, repo, content, encoding: "utf-8" });
		const tree = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
			owner,
			repo,
			base_tree: treeSha,
			tree: [
				{
					mode: "100644",
					path: "README.md",
					sha: blob.data.sha,
					type: "blob"
				}
			]
		});

		const commit = await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
			owner,
			repo,
			message: "docs(Readme): update readme content [skip ci]",
			tree: tree.data.sha,
			parents: [currentSha]
		});

		await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
			owner,
			repo,
			ref: ref.data.ref,
			sha: commit.data.sha
		});
	}
}
