import type { GitHubRepoContext } from "@ijsblokje/utils/types.js";
import requestWithPagination from "@ijsblokje/utils/RequestWithPagination.js";
import type { components } from "@octokit/openapi-types";
import { GitHubInstallation } from "../structures/GitHubInstallation.js";
import { Collection } from "@discordjs/collection";
import { LABEL_CONFIG_LOCATION, README_TEMPLATE_LOCATION } from "@ijsblokje/utils/constants.js";
import type { Endpoints } from "@octokit/types";
import type { Octokit } from "@ijsblokje/octokit";
import { request } from "@octokit/request";

export class InstallationManager {
	/** The octokit instance that handles all GitHub requests */
	public readonly octokit: Octokit;

	/** Collection containing cached github installations */
	public readonly cache = new Collection<string, GitHubInstallation>();

	public constructor(octokit: Octokit) {
		this.octokit = octokit;
	}

	public async loadAll() {
		const installations = await this.getInstallations();
		if (!installations) return;

		await Promise.all(installations.map(this.loadInstallation.bind(this)));
	}

	/**
	 * Loads an installation
	 * @param installation The GitHub installation data
	 */
	public async loadInstallation(installation: ListInstallationsItem) {
		if (!installation.account || !("login" in installation.account)) return;
		const token = await this.getAccessToken(installation.id, { contents: "read" });
		if (!token) return;

		const readmeRepository = installation.account.type === "User" ? installation.account.login : ".github";
		const readme = await this.getReadmeTemplate(token.token, { owner: installation.account.login, repo: readmeRepository });
		const labels = await this.getLabelConfig(token.token, { owner: installation.account.login, repo: readmeRepository });

		const repositories = await this.getRepositories(token.token);
		if (!repositories) return;

		const instance = new GitHubInstallation(installation, { manager: this, readme, labels });
		this.cache.set(instance.name, instance);

		await request("DELETE /installation/token", { headers: { authorization: `Bearer ${token.token}` } }).catch(() => void 0);
	}

	/**
	 * Fetches the list of repositories of an installation
	 * @param token The installation access token
	 * @returns
	 */
	public async getRepositories(token: string) {
		try {
			const fetch = (page: number) =>
				request("GET /installation/repositories", {
					headers: { authorization: `Bearer ${token}` },
					per_page: 100,
					page
				});

			const repoListRequest = await requestWithPagination(fetch, (res) => res.data.repositories.length === 100);
			const repositories = repoListRequest.map((repoReq) => repoReq.data.repositories).reduce((a, b) => [...a, ...b]);
			return repositories;
		} catch (error) {
			this.octokit.log.error("Failed to fetch list of repositories", error);
			return null;
		}
	}

	/**
	 * Fetches the readme template of an installation
	 * @param token The installation access token
	 * @returns
	 */
	public async getReadmeTemplate(token: string, ctx: GitHubRepoContext) {
		try {
			const response = await request("GET /repos/{owner}/{repo}/contents/{path}", {
				...ctx,
				path: README_TEMPLATE_LOCATION,
				headers: { authorization: `Bearer ${token}` }
			});

			return "content" in response.data ? response.data.content : null;
		} catch (error) {
			this.octokit.log.warn(`Failed to fetch readme template content from ${ctx.owner}/${ctx.repo}`, error);
			return null;
		}
	}

	/**
	 * Fetches the label config of an installation
	 * @param token The installation access token
	 * @returns
	 */
	public async getLabelConfig(token: string, ctx: GitHubRepoContext) {
		try {
			const response = await request("GET /repos/{owner}/{repo}/contents/{path}", {
				...ctx,
				path: LABEL_CONFIG_LOCATION,
				headers: { authorization: `Bearer ${token}` }
			});

			return "content" in response.data ? response.data.content : null;
		} catch (error) {
			this.octokit.log.warn(`Failed to fetch label config content from ${ctx.owner}/${ctx.repo}`, error);
			return null;
		}
	}

	/**
	 * Creates an access token for the provided installation
	 * @param installationId The installation id you want to get an access token from
	 * @param permissions The permissions the access token should have
	 * @returns
	 */
	public async getAccessToken(installationId: number, permissions: components["schemas"]["installation"]["permissions"]) {
		try {
			const token = await this.octokit.request("POST /app/installations/{installation_id}/access_tokens", {
				installation_id: installationId,
				permissions
			});
			return token.data;
		} catch (error) {
			this.octokit.log.error(`Failed to create installation access token for installation ${installationId}`, error);
			return null;
		}
	}

	/**
	 * Fetches the list of app installations
	 * @returns
	 */
	public async getInstallations() {
		try {
			const fetch = (page: number) => this.octokit.request("GET /app/installations", { page, per_page: 100 });
			const fetchRequest = await requestWithPagination(fetch, (res) => res.data.length === 100);
			const installations = fetchRequest.map((repoReq) => repoReq.data).reduce((a, b) => [...a, ...b]);
			return installations;
		} catch (error) {
			this.octokit.log.error("Failed to fetch list of app installations", error);
			return null;
		}
	}
}

export type ListInstallationsItem = Endpoints["GET /app/installations"]["response"]["data"][0];
