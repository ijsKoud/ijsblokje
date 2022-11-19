import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";
import { Changelog } from "../../../lib/Structures/Changelog.js";

interface Repo {
	owner: string;
	repo: string;
}

@ApplyActionOptions({
	event: "commit_comment"
})
export default class ReadmeSync extends Action {
	public changelog = new Changelog(this.bot);

	public async run(ctx: Action.Context<"commit_comment">) {
		const repo = ctx.repo();
		if (ctx.payload.sender.login !== "ijsKoud" || ctx.payload.action !== "created") return;
		if (ctx.payload.comment.body.startsWith(`@${process.env.BOT_NAME} release v`)) {
			const version = this.changelog.getVersion(ctx);

			if (!version) return;

			const blobs = await Promise.all([this.createPkgCommit(ctx, version, repo), this.createConfigCommit(ctx, version, repo)]);
			const { branchRef, treeSha, currentSha } = await this.getCommitData(ctx, repo);
			const { git } = ctx.octokit;

			const tree = await git.createTree({
				...repo,
				base_tree: treeSha,
				tree: blobs
					.filter((blob) => Boolean(blob.blob))
					.map((blob) => ({ mode: "100644", path: blob.path, sha: blob.blob!.data.sha, type: "blob" }))
			});

			const commit = await git.createCommit({
				message: `chore(Release): v${version}`,
				tree: tree.data.sha,
				parents: [currentSha],
				...repo
			});

			await git.updateRef({
				...repo,
				ref: branchRef,
				sha: commit.data.sha
			});

			const body = await this.changelog.run(ctx);
			await ctx.octokit.repos.createRelease({ ...repo, tag_name: `v${version}`, name: version, body });
		}
	}

	private async getCommitData(ctx: Action.Context<"commit_comment">, repo: Repo) {
		const branchRef = `heads/${ctx.payload.repository.master_branch ?? "main"}`;
		const { git } = ctx.octokit;

		const ref = await git.getRef({ ...repo, ref: branchRef });
		const currentSha = ref.data.object.sha;

		const latestCommitData = await git.getCommit({
			...repo,
			commit_sha: currentSha
		});
		const treeSha = latestCommitData.data.tree.sha;

		return {
			treeSha,
			currentSha,
			branchRef
		};
	}

	private async createPkgCommit(ctx: Action.Context<"commit_comment">, version: string, repo: Repo) {
		const packageJson = await ctx.octokit.repos.getContent({ ...repo, path: "package.json" }).catch(() => null);
		if (!packageJson || !("content" in packageJson.data)) return {};

		const packageJsonContent = Buffer.from(packageJson.data.content, "base64").toString();
		const newPackageJson = packageJsonContent.replace(this.changelog.pkgVersionRegex, `"version": "${version}"`);

		const { git } = ctx.octokit;
		const blob = await git.createBlob({
			...repo,
			content: newPackageJson,
			encoding: "utf-8"
		});

		return {
			blob,
			path: "package.json"
		};
	}

	private async createConfigCommit(ctx: Action.Context<"commit_comment">, version: string, repo: Repo) {
		const readmeConfig = await ctx.octokit.repos.getContent({ ...repo, path: ".github/.readmeconfig.json" }).catch(() => null);
		if (!readmeConfig || !("content" in readmeConfig.data)) return {};

		const readmeConfigContent = Buffer.from(readmeConfig.data.content, "base64").toString();
		const newReadmeConfig = readmeConfigContent.replace(this.changelog.readmeVersionRegex, `"project.version": "${version}"`);

		const { git } = ctx.octokit;
		const blob = await git.createBlob({
			...repo,
			content: newReadmeConfig,
			encoding: "utf-8"
		});

		return {
			blob,
			path: ".github/.readmeconfig.json"
		};
	}
}
