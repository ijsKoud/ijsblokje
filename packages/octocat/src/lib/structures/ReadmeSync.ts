import type { Endpoints } from "@octokit/types";
import { parse } from "smol-toml";
import { z } from "zod";
import _ from "lodash";
import type { Octokit } from "@ijsblokje/octokit";

export class ReadmeSync {
	/** The readme template */
	public templateReadme: string;

	/** The owner of the installation  */
	public owner: string;

	public constructor(readme: string, owner: string) {
		this.templateReadme = readme;
		this.owner = owner;
	}

	/**
	 * Generates a readme with the provided config
	 * @param config The toml config
	 * @param octokit The octokit with installation auth instance
	 * @param repo The repository name
	 * @returns
	 */
	public async generate(config: ReadmeConfig, octokit: Octokit, repo: string) {
		let readme = this.templateReadme;

		const getFile = async (path: string) => {
			try {
				const data = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", { owner: this.owner, repo, path });
				return "content" in data.data ? Buffer.from(data.data.content, "base64").toString() : null;
			} catch (error) {
				return null;
			}
		};

		const keys = Object.keys(config) as (keyof typeof config)[];
		for (const key of keys) {
			const variables: Record<string, string | string[]> = config[key];

			for (const variableKey of Object.keys(variables)) {
				const variable = variables[variableKey];
				let replaceValue = variable;
				if (key === "variables" && typeof variable === "string" && variable.endsWith(".md")) {
					const data = await getFile(variable);
					if (data) replaceValue = data;
				}

				const cleanedVariable = typeof replaceValue === "string" ? replaceValue : replaceValue.join("\n");
				readme = readme.replaceAll(`{${key}.${variableKey}}`, cleanedVariable);
			}
		}

		return readme;
	}

	/**
	 * Parses the provided toml config
	 * @param repository The repository the config was from
	 * @param toml The toml config
	 * @returns
	 */
	public static getConfig(repository: GitHubRepository, toml: string) {
		const baseConfig = {
			repo: {
				name: repository.name,
				owner: repository.owner.login,
				description: repository.description ?? "",
				license: repository.license?.spdx_id || "MIT"
			}
		};

		try {
			const parsedToml = parse(toml);
			const mergedConfig = _.merge(baseConfig, parsedToml);
			// if (typeof parsedToml.repo === "object") mergedConfig.repo = { ...baseConfig.repo, ...parsedToml.repo };

			const zodSchema = z.object({
				repo: z.object({
					name: z.string(),
					owner: z.string(),
					description: z.string(),
					license: z.string()
				}),
				project: z.object({
					icon: z.string(),
					icon_width: z.string(),
					version: z.string()
				}),
				variables: z.record(z.string(), z.string().or(z.array(z.string()))).default({})
			});

			const config = zodSchema.parse(mergedConfig);
			return config;
		} catch (error) {
			return null;
		}
	}
}

export type GitHubRepository = Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"];
export type ReadmeConfig = NonNullable<ReturnType<(typeof ReadmeSync)["getConfig"]>>;
