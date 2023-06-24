import type { GitHubInstallation } from "@ijsblokje/octocat";
import type { ReadmeConfig } from "@ijsblokje/octocat/dist/lib/structures/ReadmeSync.js";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";

async function pushReadmeChanges(event: EmitterWebhookEvent<"push">, config: ReadmeConfig, octokit: Octokit, installation: GitHubInstallation) {
	if (!installation.readme) return;

	const repo = event.payload.repository.name;
	const owner = event.payload.repository.owner.login;
	const refId = event.payload.ref.replace("refs/", "");

	try {
		const content = await installation.readme.generate(config, octokit, event.payload.repository.name);

		const ref = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", { owner, repo, ref: refId });
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
			ref: refId,
			sha: commit.data.sha
		});
	} catch (err) {
		octokit.logger.error("[PushReadmeChange]: Unable to push changes to GitHub ", err);
	}
}

export default pushReadmeChanges;
