import { Collection } from "@discordjs/collection";
import type ijsblokje from "../ijsBlokje.js";
import type { Action } from "../Structures/Action.js";
import type { Repository } from "../types.js";
import { request } from "@octokit/request";

export default class DataHandler {
	public repos: Repository[] = [];
	public labels = new Collection<string, string[]>();

	public constructor(public bot: ijsblokje) {}

	public async start() {
		this.bot.probot.probotApp.on("repository", this.repoUpdate.bind(this));
		this.bot.probot.probotApp.on("installation_repositories", this.updateReposList.bind(this));

		await this.updateReposList();
	}

	private async repoUpdate(ctx: Action.Context<"repository">) {
		const { repository } = ctx.payload;
		const repoDetails = ctx.repo();

		const isEqual = (rep: Repository) => rep.owner === repoDetails.owner && rep.repo === repoDetails.repo;
		const repo = { ...repoDetails, archived: repository.archived, private: repository.private, readmeSync: { config: false } };

		const configRes = await ctx.octokit.repos.getContent({ ...repoDetails, path: ".github/.readmeconfig.json" }).catch(() => null);
		const config = configRes ? "content" in configRes.data : false;

		repo.readmeSync.config = config;
		this.repos = [repo, ...this.repos.filter((rep) => isEqual(rep))];
	}

	private async updateReposList() {
		const installations = await this.bot.octokit.apps.listInstallations();

		const hasReadMeConfig = async (owner: string, repo: string, token: string) => {
			const configRes = await request("GET /repos/{owner}/{repo}/contents/{path}", {
				owner,
				repo,
				path: ".github/.readmeconfig.json",
				headers: { authorization: `Bearer ${token}` }
			}).catch(() => null);

			return configRes ? "content" in configRes.data : false;
		};

		for (const installation of installations.data) {
			const token = await this.bot.octokit.apps.createInstallationAccessToken({
				installation_id: installation.id,
				permissions: { contents: "read" }
			});
			const reposListRes = await request("GET /installation/repositories", {
				headers: { authorization: `Bearer ${token.data.token}` },
				per_page: 100
			});

			const repos: Repository[] = await Promise.all(
				reposListRes.data.repositories.map(async (repo) => ({
					owner: repo.owner.login,
					repo: repo.name,
					archived: repo.archived,
					private: repo.private,
					readmeSync: { config: await hasReadMeConfig(repo.owner.login, repo.name, token.data.token) }
				}))
			);

			await request("DELETE /installation/token", { headers: { authorization: `Bearer ${token.data.token}` } });
			this.repos.push(...repos);
		}
	}
}
