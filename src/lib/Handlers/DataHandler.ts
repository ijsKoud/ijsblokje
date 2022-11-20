import { Collection } from "@discordjs/collection";
import type ijsblokje from "../ijsBlokje.js";
import type { Action } from "../Structures/Action.js";
import type { Label, Labels, Repository } from "../types.js";
import { request } from "@octokit/request";

export default class DataHandler {
	public repos: Repository[] = [];
	public labels = new Collection<string, Label[]>();

	public constructor(public bot: ijsblokje) {}

	public async start() {
		this.bot.probot.probotApp.on("repository", this.repoUpdate.bind(this));
		this.bot.probot.probotApp.on("installation_repositories", this.updateReposList.bind(this));

		await this.updateReposList();
		await this.updateLabelsList();
	}

	public async updateLabelsList() {
		try {
			const installations = await this.bot.octokit.apps.listInstallations();
			for (const installation of installations.data) {
				const owner = installation.account?.login ?? "";
				const token = await this.bot.octokit.apps.createInstallationAccessToken({
					installation_id: installation.id,
					permissions: { contents: "read" }
				});

				const labelsRes = await request("GET /repos/{owner}/{repo}/contents/{path}", {
					owner,
					repo: owner,
					path: "config/labels.json",
					headers: { authorization: `Bearer ${token.data.token}` }
				});
				if (!("content" in labelsRes.data)) return;

				const labels: Labels = JSON.parse(Buffer.from(labelsRes.data.content, "base64").toString());
				this.labels.set("global", labels.labels);
				Object.keys(labels.repository).forEach((key) => this.labels.set(key, labels.repository[key]));
			}
		} catch (error) {
			this.bot.logger.fatal(`[DataHandler]: Unable to load labels list =>`, error);
		}
	}

	private async repoUpdate(ctx: Action.Context<"repository">) {
		const { repository } = ctx.payload;
		const repoDetails = ctx.repo();
		const isEqual = (rep: Repository) => rep.owner === repoDetails.owner && rep.repo === repoDetails.repo;

		if (["deleted", "transferred"].includes(ctx.payload.action)) {
			this.repos = this.repos.filter((rep) => isEqual(rep));
			return;
		}

		const repo: Repository = {
			...repoDetails,
			archived: repository.archived,
			private: repository.private,
			description: repository.description ?? "",
			license: repository.license?.spdx_id ?? "",
			readmeSync: { config: false }
		};

		const configRes = await ctx.octokit.repos.getContent({ ...repoDetails, path: ".github/.readmeconfig.json" }).catch(() => null);
		const config = configRes ? "content" in configRes.data : false;

		repo.readmeSync.config = config;
		this.repos = [repo, ...this.repos.filter((rep) => isEqual(rep))];
	}

	private async updateReposList() {
		try {
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
						description: repo.description ?? "",
						license: repo.license?.spdx_id ?? "",
						archived: repo.archived,
						private: repo.private,
						readmeSync: { config: await hasReadMeConfig(repo.owner.login, repo.name, token.data.token) }
					}))
				);

				await request("DELETE /installation/token", { headers: { authorization: `Bearer ${token.data.token}` } });
				this.repos.push(...repos);
			}
		} catch (error) {
			this.bot.logger.fatal(`[DataHandler]: Unable to load repositories list =>`, error);
		}
	}
}
