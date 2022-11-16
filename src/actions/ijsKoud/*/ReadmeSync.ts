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

		if (!ctx.payload.commits.some((cm) => cm.modified.includes(".gtihub/.readmeconfig.json"))) return;
		ctx;
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

				const commitHistory = await ctx.octokit.repos.listCommits({ owner, repo: repository.name, path: "README.md", per_page: 1 });
				const sha = commitHistory.data[0]?.sha || undefined;

				const history = await ctx.octokit.repos.listCommits({ owner, repo: repository.name, per_page: 1 });
				const latestSha = history.data[0].sha;

				await ctx.octokit.git
					.createRef({
						owner,
						repo: repository.name,
						ref: "refs/heads/docs/readme-design",
						sha: latestSha
					})
					.catch(() => void 0);

				await ctx.octokit.repos.getContent({
					owner,
					repo: repository.name,
					path: "README.md",
					message: "docs(Readme): update readme design",
					content: Buffer.from(updatedReadme).toString("base64"),
					sha,
					branch: "docs/readme-design"
				});

				await ctx.octokit.pulls.create({
					base: "main",
					head: "refs/heads/docs/readme-design",
					owner,
					repo: repository.name,
					title: "docs(Readme): update readme design"
				});
			} catch (err) {
				this.bot.logger.fatal(err);
			}
		});
	}
}
