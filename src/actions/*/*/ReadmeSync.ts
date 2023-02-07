import { BASE_README, README_CONFIG_LOCATION } from "../../../lib/constants.js";
import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";

@ApplyActionOptions({
	events: ["push", "repository"]
})
export default class ReadmeSync extends Action {
	public getRepoName(ctx: Action.Context<"push" | "repository">): string {
		const isOrg = Boolean(ctx.payload.organization);
		return isOrg ? ".github" : ctx.repo().owner;
	}

	public async run(_ctx: Action.Context<"push" | "repository.edited" | "repository.renamed">) {
		const repo = _ctx.repo();
		if (_ctx.name === "repository") {
			const ctx = _ctx as any as Action.Context<"repository.edited" | "repository.renamed">;
			await this.repoRun(ctx);
			return;
		}

		const ctx = _ctx as any as Action.Context<"push">;
		const isLicenseUpdate = ctx.payload.commits.some((c) => [...c.added, ...c.modified, ...c.removed].includes("LICENSE"));
		if (repo.repo === this.getRepoName(ctx as any) && ctx.payload.commits.some((cm) => cm.modified.includes(BASE_README))) {
			await this.templateUpdate(ctx);
			return;
		}

		if (
			!ctx.payload.commits.some((cm) => cm.modified.includes(README_CONFIG_LOCATION) || cm.added.includes(README_CONFIG_LOCATION)) &&
			!isLicenseUpdate
		)
			return;
		await this.configUpdate(ctx);
	}

	private async repoRun(ctx: Action.Context<"repository.edited" | "repository.renamed">) {
		if (!["renamed", "edited"].includes(ctx.payload.action)) return;
		const repo = ctx.repo();

		try {
			const readmeConfig = await ctx.octokit.repos
				.getContent({
					...repo,
					path: README_CONFIG_LOCATION
				})
				.catch(() => null);
			if (!readmeConfig || !("content" in readmeConfig.data)) return;

			const readmeData = await ctx.octokit.repos.getContent({ owner: repo.owner, repo: this.getRepoName(ctx as any), path: BASE_README });
			if (!("content" in readmeData.data)) return;

			let readme = Buffer.from(readmeData.data.content, "base64").toString();
			const content = Buffer.from(readmeConfig.data.content, "base64").toString();
			const jsonContent = JSON.parse(content);
			const keys = Object.keys(jsonContent);

			keys.forEach((key) => (readme = readme.replaceAll(`{${key}}`, this.cleanKey(jsonContent[key]))));
			readme = readme
				.replaceAll("{repo.name}", ctx.payload.repository.name)
				.replaceAll("{repo.description}", ctx.payload.repository.description ?? "")
				.replaceAll("{repo.license}", ctx.payload.repository.license?.spdx_id ?? "None");

			await this.createCommit(ctx as any, readme, repo);
		} catch (err) {
			this.bot.logger.fatal(err);
		}
	}

	private async configUpdate(ctx: Action.Context<"push">) {
		try {
			const repo = ctx.repo();
			const readmeConfig = await ctx.octokit.repos
				.getContent({
					...repo,
					path: README_CONFIG_LOCATION
				})
				.catch(() => null);
			if (!readmeConfig || !("content" in readmeConfig.data)) return;

			const readmeData = await ctx.octokit.repos.getContent({ owner: repo.owner, repo: this.getRepoName(ctx as any), path: BASE_README });
			if (!("content" in readmeData.data)) return;

			let readme = Buffer.from(readmeData.data.content, "base64").toString();
			const content = Buffer.from(readmeConfig.data.content, "base64").toString();
			const jsonContent = JSON.parse(content);
			jsonContent["project.icon_width"] ??= "100px";

			const keys = Object.keys(jsonContent);

			const extraInfo = jsonContent["project.extra_info"];
			if (extraInfo && typeof extraInfo === "string" && (extraInfo as string).startsWith(".github/") && (extraInfo as string).endsWith(".md")) {
				const extraInfoData = await ctx.octokit.repos
					.getContent({
						...repo,
						path: extraInfo
					})
					.catch(() => null);
				if (extraInfoData && "content" in extraInfoData.data)
					jsonContent["project.extra_info"] = Buffer.from(extraInfoData.data.content, "base64").toString();
			}

			keys.forEach((key) => (readme = readme.replaceAll(`{${key}}`, this.cleanKey(jsonContent[key]))));
			readme = readme
				.replaceAll("{repo.name}", ctx.payload.repository.name)
				.replaceAll("{repo.description}", ctx.payload.repository.description ?? "")
				.replaceAll("{repo.license}", ctx.payload.repository.license?.spdx_id ?? "None");

			await this.createCommit(ctx as any, readme, repo);
		} catch (err) {
			this.bot.logger.fatal(err);
		}
	}

	private async templateUpdate(ctx: Action.Context<"push">) {
		const repo = ctx.repo();

		const readmeData = await ctx.octokit.repos.getContent({ ...repo, path: BASE_README });
		if (!("content" in readmeData.data)) return;

		const readme = Buffer.from(readmeData.data.content, "base64").toString();
		const list = this.bot.DataHandler.repos.filter((rep) => rep.owner === repo.owner);

		list.forEach(async (repository) => {
			try {
				const readmeConfig = await ctx.octokit.repos
					.getContent({
						owner: repository.owner,
						repo: repository.repo,
						path: README_CONFIG_LOCATION
					})
					.catch(() => null);
				if (!readmeConfig || !("content" in readmeConfig.data)) return;

				const content = Buffer.from(readmeConfig.data.content, "base64").toString();
				const jsonContent = JSON.parse(content);
				jsonContent["project.icon_width"] ??= "100px";

				const keys = Object.keys(jsonContent);
				let updatedReadme = readme;

				const extraInfo = jsonContent["project.extra_info"];
				if (
					extraInfo &&
					typeof extraInfo === "string" &&
					(extraInfo as string).startsWith(".github/") &&
					(extraInfo as string).endsWith(".md")
				) {
					const extraInfoData = await ctx.octokit.repos
						.getContent({
							...repo,
							path: extraInfo
						})
						.catch(() => null);
					if (extraInfoData && "content" in extraInfoData.data)
						jsonContent["project.extra_info"] = Buffer.from(extraInfoData.data.content, "base64").toString();
				}

				keys.forEach((key) => (updatedReadme = updatedReadme.replaceAll(`{${key}}`, jsonContent[key])));
				updatedReadme = updatedReadme
					.replaceAll("{repo.name}", repository.repo)
					.replaceAll("{repo.description}", repository.description)
					.replaceAll("{repo.license}", repository.license || "None");

				await this.createCommit(ctx as any, updatedReadme, { owner: repository.owner, repo: repository.repo });
			} catch (err) {
				this.bot.logger.fatal(err);
			}
		});
	}

	private async createCommit(
		ctx: Action.Context<"push" | "repository.edited" | "repository.renamed">,
		content: string,
		repo: { owner: string; repo: string }
	) {
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
			message: "docs(Readme): update readme content [skip ci]",
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

	private cleanKey(data: any): string {
		if (Array.isArray(data)) return data.join("\n");
		if (["undefined", "object", "function", "symbol"].includes(typeof data)) return "";

		return data;
	}
}
