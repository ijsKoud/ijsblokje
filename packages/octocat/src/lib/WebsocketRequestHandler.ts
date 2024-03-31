import type { Octokit } from "@ijsblokje/octokit";
import { Changelog, Commit, VersionBump } from "@ijsblokje/release";
import type { WebsocketReadmeEvent, WebsocketReleaseEvent } from "@ijsblokje/server";
import { README_CONFIG_LOCATION } from "@ijsblokje/utils/constants.js";
import requestWithPagination from "@ijsblokje/utils/RequestWithPagination.js";
import semver from "semver";
import { stringify } from "smol-toml";

import type { Octocat } from "./Octocat.js";

export class WebsocketRequestHandler {
	public readonly octocat: Octocat;

	public constructor(octocat: Octocat) {
		this.octocat = octocat;
	}

	/**
	 * getProposedVersion handler for the websocket server
	 * @param owner The owner of the repository
	 * @param repo The name of the repository
	 * @returns
	 */
	public async getProposedVersion(owner: string, repo: string): Promise<string | null> {
		const installation = this.octocat.installations.cache.find((installation) => installation.name.toLowerCase() === owner.toLowerCase());
		if (!installation || !installation.configs.has(repo)) return "none";

		const repoContext = { owner, repo } satisfies BaseRepositoryData;
		const latestRelease = await installation.octokit.request("GET /repos/{owner}/{repo}/releases/latest", { owner, repo }).catch(() => null);
		if (!latestRelease) return null;

		try {
			const commitsList = await this.getAllComparedCommits(installation.octokit, {
				...repoContext,
				base: latestRelease.data.tag_name,
				head: "main"
			});
			const commits = commitsList.map((commit) => new Commit(commit));
			const version = latestRelease.data.tag_name.slice(1);

			const newVersion = VersionBump.getNewVersion(commits, version);
			return newVersion;
		} catch (error) {
			this.octocat.logger.error(`Unable to find out the new version for ${owner}/${repo}`);
			return null;
		}
	}

	/**
	 * getProposedVersion handler for the websocket server
	 * @param owner The owner of the repository
	 * @param repo The name of the repository
	 * @returns
	 */
	public async releaseVersion(data: WebsocketReleaseEvent["d"]) {
		const installation = this.octocat.installations.cache.find((installation) => installation.name.toLowerCase() === data.owner.toLowerCase());
		if (!installation || !installation.configs.has(data.repo)) return;

		const repoContext = { owner: data.owner, repo: data.repo } satisfies BaseRepositoryData;
		const latestRelease = await installation.octokit.request("GET /repos/{owner}/{repo}/releases/latest", repoContext).catch(() => null);

		try {
			const commits = latestRelease
				? await this.getAllComparedCommits(installation.octokit, { ...repoContext, base: latestRelease.data.tag_name, head: "main" })
				: await this.getAllCommits(installation.octokit, repoContext);
			const generator = new Changelog(commits.map((data) => new Commit(data)));

			const Oldversion = latestRelease?.data.tag_name.slice(1) || "0.0.0";
			const version = ["patch", "minor", "major"].includes(data.version) ? semver.inc(Oldversion, data.version as any) : data.version;
			if (!version) return;

			const changelog = generator.getMarkdown(version, data.message);

			const readmeBlob = await this.updateReadme(repoContext, version, false);
			const pkgBlob = await this.updatePackageJson(repoContext, version, installation.octokit);
			const blobs = [...(readmeBlob ?? []), pkgBlob].filter(Boolean) as TreeObject[];
			if (blobs.length) await this.createCommit(blobs, repoContext, "heads/main", `chore(Release): v${version} 🎉`, installation.octokit);

			await installation.octokit.request("POST /repos/{owner}/{repo}/releases", {
				...repoContext,
				body: changelog,
				tag_name: `v${version}`,
				name: version
			});
		} catch (error) {
			this.octocat.logger.error(`Unable to release new version for ${data.owner}/${data.repo} - `, error);
		}
	}

	/**
	 * Updates the readme and optionally the version too
	 * @param repoContext The readme repository data
	 * @param version The version to update to
	 * @param push whether or not to push the commit to GitHub
	 * @returns
	 */
	public async updateReadme(repoContext: WebsocketReadmeEvent["d"], version?: string, push = true) {
		const installation = this.octocat.installations.cache.find(
			(installation) => installation.name.toLowerCase() === repoContext.owner.toLowerCase()
		);
		if (!installation || !installation.readme) return null;

		const ref = "heads/main";
		const config = installation.configs.get(repoContext.repo);
		if (!config) return null;

		try {
			const blobs: TreeObject[] = [];

			if (version) {
				config.project.version = version;
				installation.configs.set(repoContext.repo, config);

				const configContent = stringify(config);
				const configBlob = await installation.octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
					...repoContext,
					content: configContent,
					encoding: "utf-8"
				});

				blobs.push({ mode: "100644", path: README_CONFIG_LOCATION, type: "blob", sha: configBlob.data.sha });
			}

			const content = await installation.readme.generate(config, installation.octokit, repoContext.repo);
			const readmeBlob = await installation.octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
				...repoContext,
				content,
				encoding: "utf-8"
			});

			blobs.push({ mode: "100644", path: "README.md", type: "blob", sha: readmeBlob.data.sha });
			if (!push) return blobs;

			await this.createCommit(blobs, repoContext, ref, "docs(Readme): update readme content [skip ci]", installation.octokit);
			return null;
		} catch (err) {
			this.octocat.logger.error(`Unable to update readme for ${repoContext.owner}/${repoContext.repo}`, err);
			return null;
		}
	}

	/**
	 * Updates the package json if it exists in the repository
	 * @param repoContext The basic repository data
	 * @param version The version to update to
	 * @param octokit The authenticated octokit instance
	 * @returns
	 */
	private async updatePackageJson(repoContext: BaseRepositoryData, version: string, octokit: Octokit): Promise<TreeObject | null> {
		const packageJson = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", { ...repoContext, path: "package.json" });
		if (!packageJson || !("content" in packageJson.data)) return null;

		const packageJsonContent = Buffer.from(packageJson.data.content, "base64").toString();
		const newPackageJson = VersionBump.bumpJavaScript(version, packageJsonContent);

		const blob = await octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
			...repoContext,
			content: newPackageJson,
			encoding: "utf-8"
		});

		return { mode: "100644", type: "blob", path: packageJson.data.path, sha: blob.data.sha };
	}

	/**
	 * Creates a commit with the provided blobs
	 * @param trees The array of tree blobs
	 * @param repoContext The base repository information
	 * @param ref The commit ref
	 * @param message The commit Message
	 * @param octokit The authenticated octokit
	 */
	private async createCommit(trees: TreeObject[], repoContext: BaseRepositoryData, ref: string, message: string, octokit: Octokit) {
		const refContext = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", { ...repoContext, ref });
		const currentSha = refContext.data.object.sha;

		const latestCommit = await octokit.request("GET /repos/{owner}/{repo}/git/commits/{commit_sha}", {
			...repoContext,
			commit_sha: currentSha
		});

		const treeSha = latestCommit.data.tree.sha;
		const tree = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
			...repoContext,
			base_tree: treeSha,
			tree: trees
		});

		const commit = await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
			...repoContext,
			message,
			tree: tree.data.sha,
			parents: [currentSha]
		});

		await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
			...repoContext,
			ref,
			sha: commit.data.sha
		});
	}

	/**
	 * Retrieves all the commits that exist on a repository
	 * @param octokit The authenticated octokit
	 * @param ctx The basic repository data
	 */
	private async getAllCommits(octokit: Octokit, ctx: BaseRepositoryData) {
		const request = (page: number) =>
			octokit.request("GET /repos/{owner}/{repo}/commits", { ...ctx, page, per_page: 100 }).then((res) => res.data);
		const check = (data: Awaited<ReturnType<typeof request>>) => data.length === 100;

		const requests = await requestWithPagination(request, check);
		return requests.reduce((a, b) => [...a, ...b]);
	}

	/**
	 * Retrieves all the commits between 2 refs
	 * @param octokit The authenticated octokit
	 * @param ctx The request data
	 */
	private async getAllComparedCommits(octokit: Octokit, ctx: BaseRepositoryData & { head: string; base: string }) {
		const request = (page: number) =>
			octokit.request("GET /repos/{owner}/{repo}/compare/{base}...{head}", { ...ctx, page, per_page: 100 }).then((res) => res.data.commits);
		const check = (data: Awaited<ReturnType<typeof request>>) => data.length === 100;

		const requests = await requestWithPagination(request, check);
		return requests.reduce((a, b) => [...a, ...b]);
	}
}

export interface BaseRepositoryData {
	/** The name of the repository */
	repo: string;

	/** The name of the repository owner */
	owner: string;
}

export interface TreeObject {
	path?: string;
	mode?: "100644" | "100755" | "040000" | "160000" | "120000";
	type?: "commit" | "blob" | "tree";
	sha?: string | null;
	content?: string;
}
