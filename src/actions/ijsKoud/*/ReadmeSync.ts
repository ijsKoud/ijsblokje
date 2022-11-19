import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";
import type { Endpoints } from "@octokit/types";

@ApplyActionOptions({
	event: "push"
})
export default class ReadmeSync extends Action {
	public async run(ctx: Action.Context<"push">) {
		const repo = ctx.repo();
		if (repo.repo === repo.owner && ctx.payload.commits.some((cm) => cm.modified.includes("config/readme_ijskoud.md"))) {
			await this.templateUpdate(ctx);
			return;
		}

		if (!ctx.payload.commits.some((cm) => cm.modified.includes(".github/.readmeconfig.json") || cm.added.includes(".github/.readmeconfig.json")))
			return;
		await this.configUpdate(ctx);
	}

	private async configUpdate(ctx: Action.Context<"push">) {
		try {
			const repo = ctx.repo();
			const readmeConfig = await ctx.octokit.repos
				.getContent({
					...repo,
					path: ".github/.readmeconfig.json"
				})
				.catch(() => null);
			if (!readmeConfig || !("content" in readmeConfig.data)) return;

			const readmeData = await ctx.octokit.repos.getContent({ owner: repo.owner, repo: repo.owner, path: "config/readme_ijskoud.md" });
			if (!("content" in readmeData.data)) return;

			let readme = Buffer.from(readmeData.data.content, "base64").toString();
			const content = Buffer.from(readmeConfig.data.content, "base64").toString();
			const jsonContent = JSON.parse(content);
			const keys = Object.keys(jsonContent);

			keys.forEach((key) => (readme = readme.replaceAll(`{${key}}`, jsonContent[key])));
			readme = readme
				.replaceAll("{repo.name}", ctx.payload.repository.name)
				.replaceAll("{repo.description}", ctx.payload.repository.description ?? "")
				.replaceAll("{repo.license}", ctx.payload.repository.license?.spdx_id ?? "None");

			await this.createCommit(ctx, readme, repo);
		} catch (err) {
			this.bot.logger.fatal(err);
		}
	}

	private async templateUpdate(ctx: Action.Context<"push">) {
		const repo = ctx.repo();

		const readmeData = await ctx.octokit.repos.getContent({ ...repo, path: "config/readme_ijskoud.md" });
		if (!("content" in readmeData.data)) return;

		const readme = Buffer.from(readmeData.data.content, "base64").toString();
		const list: Endpoints["GET /users/{username}/repos"]["response"]["data"] = [];

		let repos = await ctx.octokit.repos.listForUser({
			username: repo.owner,
			type: "owner",
			per_page: 100
		});

		list.push(...repos.data.filter((r) => !r.archived));

		while (repos.data.length === 100) {
			repos = await ctx.octokit.repos.listForUser({
				username: repo.owner,
				type: "owner",
				per_page: 100
			});

			list.push(...repos.data.filter((r) => !r.archived));
		}

		list.forEach(async (repository) => {
			const [owner] = repository.full_name.split("/");
			try {
				const readmeConfig = await ctx.octokit.repos
					.getContent({
						owner,
						repo: repository.name,
						path: ".github/.readmeconfig.json"
					})
					.catch(() => null);
				if (!readmeConfig || !("content" in readmeConfig.data)) return;

				const content = Buffer.from(readmeConfig.data.content, "base64").toString();
				const jsonContent = JSON.parse(content);

				const keys = Object.keys(jsonContent);
				let updatedReadme = readme;

				keys.forEach((key) => (updatedReadme = updatedReadme.replaceAll(`{${key}}`, jsonContent[key])));
				updatedReadme = updatedReadme
					.replaceAll("{repo.name}", repository.name)
					.replaceAll("{repo.description}", repository.description ?? "")
					.replaceAll("{repo.license}", repository.license?.spdx_id ?? "None");

				await this.createCommit(ctx, updatedReadme, { owner, repo: repository.name });
			} catch (err) {
				this.bot.logger.fatal(err);
			}
		});
	}

	private async createCommit(ctx: Action.Context<"push">, content: string, repo: { owner: string; repo: string }) {
		const branchRef = `heads/${ctx.payload.repository.master_branch ?? "main"}`;
		const { git } = ctx.octokit;

		const ref = await git.getRef({ ...repo, ref: branchRef });
		const currentSha = ref.data.object.sha;

		const latestCommitData = await git.getCommit({
			...repo,
			commit_sha: currentSha
		});
		const treeSha = latestCommitData.data.tree.sha;

		const blob = await git.createBlob({
			...repo,
			content,
			encoding: "utf-8"
		});

		const tree = await git.createTree({
			...repo,
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

		const commit = await git.createCommit({
			message: "docs(Readme): update readme content",
			tree: tree.data.sha,
			parents: [currentSha],
			...repo
		});

		await git.updateRef({
			...repo,
			ref: branchRef,
			sha: commit.data.sha
		});
	}
}
