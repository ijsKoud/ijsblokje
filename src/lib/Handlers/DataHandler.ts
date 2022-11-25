import { Collection } from "@discordjs/collection";
import type ijsblokje from "../ijsBlokje.js";
import type { Action } from "../Structures/Action.js";
import type { Label, Labels, Repository } from "../types.js";
import { LABELS_CONFIG, README_CONFIG_LOCATION, REPO_UPDATE_EVENTS } from "../constants.js";
import { request } from "@octokit/request";

export default class DataHandler {
	public repos: Repository[] = [];
	public labels = new Collection<string, Label[]>();

	public constructor(public bot: ijsblokje) {}

	public async start() {
		this.bot.probot.probotApp.on("repository", this.repoUpdate.bind(this));
		this.bot.probot.probotApp.on("installation_repositories", this.installationRepoUpdate.bind(this));
		this.bot.probot.probotApp.on("installation", this.installation.bind(this));

		await this.updateReposList();
		await this.updateLabelsList();
	}

	public async updateLabelsList() {
		try {
			const installations = await this.bot.octokit.apps.listInstallations();
			const filtered = installations.data.filter((installation) => this.bot.allowedInstallations.includes(installation.account?.login ?? ""));

			for (const installation of filtered) {
				const owner = installation.account?.login ?? "";
				const isOrg = installation.account?.type === "Organization";
				const token = await this.bot.octokit.apps.createInstallationAccessToken({
					installation_id: installation.id,
					permissions: { contents: "read" }
				});

				const labelsRes = await request("GET /repos/{owner}/{repo}/contents/{path}", {
					owner,
					repo: isOrg ? ".github" : owner,
					path: LABELS_CONFIG,
					headers: { authorization: `Bearer ${token.data.token}` }
				});
				if (!("content" in labelsRes.data)) return;

				const labels: Labels = JSON.parse(Buffer.from(labelsRes.data.content, "base64").toString());
				this.labels.set(`${owner}-global`, labels.labels);
				Object.keys(labels.repository).forEach((key) => this.labels.set(key, labels.repository[key]));
			}
		} catch (error) {
			this.bot.logger.fatal(`[DataHandler]: Unable to load labels list =>`, error);
		}
	}

	private async repoUpdate(ctx: Action.Context<"repository">) {
		const { repository } = ctx.payload;
		const repoDetails = ctx.repo();

		if (!this.bot.allowedInstallations.includes(repoDetails.owner)) return;
		const isEqual = (rep: Repository) => rep.owner === repoDetails.owner && rep.repo === repoDetails.repo;

		if (REPO_UPDATE_EVENTS.includes(ctx.payload.action)) {
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

		const configRes = await ctx.octokit.repos.getContent({ ...repoDetails, path: README_CONFIG_LOCATION }).catch(() => null);
		const config = configRes ? "content" in configRes.data : false;

		repo.readmeSync.config = config;
		this.repos = [repo, ...this.repos.filter((rep) => isEqual(rep))];
	}

	private async updateReposList() {
		try {
			const installations = await this.bot.octokit.apps.listInstallations();
			const filtered = installations.data.filter((installation) => this.bot.allowedInstallations.includes(installation.account?.login ?? ""));

			const hasReadMeConfig = async (owner: string, repo: string, token: string) => {
				const configRes = await request("GET /repos/{owner}/{repo}/contents/{path}", {
					owner,
					repo,
					path: README_CONFIG_LOCATION,
					headers: { authorization: `Bearer ${token}` }
				}).catch(() => null);

				return configRes ? "content" in configRes.data : false;
			};

			for (const installation of filtered) {
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
						owner: repo.organization ? repo.organization.login : repo.owner.login,
						repo: repo.name,
						description: repo.description ?? "",
						license: repo.license?.spdx_id ?? "",
						archived: repo.archived,
						private: repo.private,
						readmeSync: {
							config: await hasReadMeConfig(repo.organization ? repo.organization.login : repo.owner.login, repo.name, token.data.token)
						}
					}))
				);

				await request("DELETE /installation/token", { headers: { authorization: `Bearer ${token.data.token}` } });
				this.repos.push(...repos);
			}
		} catch (error) {
			this.bot.logger.fatal(`[DataHandler]: Unable to load repositories list =>`, error);
		}
	}

	private async installation(ctx: Action.Context<"installation">) {
		if (ctx.payload.action === "created") {
			const owner = ctx.payload.installation.account?.login ?? "";
			const isOrg = ctx.payload.installation.account?.type === "Organization";
			const token = await this.bot.octokit.apps.createInstallationAccessToken({
				installation_id: ctx.payload.installation.id,
				permissions: { contents: "read" }
			});

			const labelsRes = await request("GET /repos/{owner}/{repo}/contents/{path}", {
				owner,
				repo: isOrg ? ".github" : owner,
				path: LABELS_CONFIG,
				headers: { authorization: `Bearer ${token.data.token}` }
			});
			if (!("content" in labelsRes.data)) return;

			const labels: Labels = JSON.parse(Buffer.from(labelsRes.data.content, "base64").toString());
			this.labels.set(`${owner}-global`, labels.labels);
			Object.keys(labels.repository).forEach((key) => this.labels.set(key, labels.repository[key]));
		} else if (ctx.payload.action === "deleted") {
			const owner = ctx.payload.installation.account.login ?? "";
			const keys = [...this.labels.keys()];
			const related = keys.filter((key) => key.startsWith(`${owner}/`));

			this.labels.delete(`${owner}-global`);
			related.forEach((key) => this.labels.delete(key));
		}
	}

	private async installationRepoUpdate(ctx: Action.Context<"installation_repositories">) {
		if (!this.bot.allowedInstallations.includes(ctx.payload.installation.account.login)) return;

		try {
			const hasReadMeConfig = async (owner: string, repo: string, token: string) => {
				const configRes = await request("GET /repos/{owner}/{repo}/contents/{path}", {
					owner,
					repo,
					path: README_CONFIG_LOCATION,
					headers: { authorization: `Bearer ${token}` }
				}).catch(() => null);

				return configRes ? "content" in configRes.data : false;
			};

			const token = await this.bot.octokit.apps.createInstallationAccessToken({
				installation_id: ctx.payload.installation.id,
				permissions: { contents: "read" }
			});
			const reposListRes = await request("GET /installation/repositories", {
				headers: { authorization: `Bearer ${token.data.token}` },
				per_page: 100
			});

			const repos: Repository[] = await Promise.all(
				reposListRes.data.repositories.map(async (repo) => ({
					owner: repo.organization ? repo.organization.login : repo.owner.login,
					repo: repo.name,
					description: repo.description ?? "",
					license: repo.license?.spdx_id ?? "",
					archived: repo.archived,
					private: repo.private,
					readmeSync: {
						config: await hasReadMeConfig(repo.organization ? repo.organization.login : repo.owner.login, repo.name, token.data.token)
					}
				}))
			);

			await request("DELETE /installation/token", { headers: { authorization: `Bearer ${token.data.token}` } });
			this.repos.push(...repos);
		} catch (error) {
			this.bot.logger.fatal(`[DataHandler]: Unable to load new Installation repositories list =>`, error);
		}
	}
}
