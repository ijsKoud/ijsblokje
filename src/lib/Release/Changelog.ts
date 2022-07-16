import parseLinkHeader from "parse-link-header";
import { ProbotOctokit } from "probot";
import type { Ijsblokje } from "../../bot/ijsblokje";

interface CommitData {
	type: string;
	message: string;
}

export class Changelog {
	public constructor(public bot: Ijsblokje) {}

	public async run(owner: string, repo: string, headRef: string): Promise<string> {
		const app = this.bot.probot.probotApp;
		const octokit = new ProbotOctokit({ log: app.log });

		const latestRelease = await octokit.repos.getLatestRelease({ repo, owner }).catch(() => null);
		let parsedCommits: CommitData[];
		if (latestRelease?.data) {
			const baseRef = latestRelease.data.tag_name;
			const commits = await octokit.repos.compareCommits({
				base: baseRef,
				head: headRef,
				owner,
				repo
			});

			parsedCommits = commits.data.commits.map((commit) =>
				this.getCommitData(commit.commit.message, commit.sha, `https://github.com/${owner}/${repo}/commit/${commit.sha}`)
			);
		} else {
			const commitsList = await octokit.repos.listCommits({ repo, owner });
			const parsedHeader = parseLinkHeader(commitsList.headers.link);

			const firstCommits = await octokit.repos.listCommits({ owner, repo, page: (parsedHeader?.last.page as number | undefined) ?? 1 });
			const firstCommit = firstCommits.data[firstCommits.data.length - 1];
			const baseRef = firstCommit.sha;
			const commits = await octokit.repos.compareCommits({
				base: baseRef,
				head: headRef,
				owner,
				repo
			});

			parsedCommits = commits.data.commits.map((commit) =>
				this.getCommitData(commit.commit.message, commit.sha, `https://github.com/${owner}/${repo}/commit/${commit.sha}`)
			);
		}

		const changelog = this.getMarkdown(parsedCommits);
		return changelog;
	}

	public getVersion(message: string): string | null {
		if (!message.startsWith("chore(Release): v")) return null;

		message = message.replace("chore(Release): v", "");
		const version = message.slice(0, 5);
		if (version.split(".").length !== 3) return null;

		return version;
	}

	private getMarkdown(commits: CommitData[]): string {
		const categories: Record<string, string[]> = {};

		for (const commit of commits) {
			let key = "";

			switch (commit.type) {
				case "feat":
					key = "features";
					break;
				case "fix":
					key = "bug_fixes";
					break;
				case "chore":
					if (commit.message.includes("**Release**: v")) key = "";
					else key = "general";
					break;
				case "docs":
					key = "documentation";
					break;
				case "types":
					key = "typings";
					break;
				case "perf":
					key = "performance";
					break;
				case "refactor":
					key = "refactor";
					break;
				case "style":
					key = "style";
					break;
				case "test":
					key = "testing";
					break;
				case "ci":
					key = "continuous_integration";
					break;
				default:
					break;
			}

			if (key.length) {
				const category = categories[key] ?? [];
				category.push(commit.message);
				categories[key] = category;
			}
		}

		let changelog = "";

		for (const key of Object.keys(categories)) {
			const title = this.getCategoryTitle(key);
			const data = categories[key];

			changelog += `## ${title}\n${data.map((msg) => `- ${msg}`).join("\n")}\n\n`;
		}

		return changelog.trim();
	}

	private getCategoryTitle(category: string): string {
		const split = category.split("_");
		const title = split.map((str) => str.charAt(0).toUpperCase() + str.slice(1));

		return title.join(" ");
	}

	private getCommitData(commit: string, hash: string, url: string): CommitData {
		const [title] = commit.split("\n\n");
		const commitData = this.getCommitInfo(title);

		return {
			message: `${commitData.details} ([${hash.slice(0, 7)}](${url}))`,
			type: commitData.type
		};
	}

	private getCommitInfo(message: string): { type: string; details: string } {
		let [type, ..._details] = message.split(":");
		let component = "";
		let details = _details.join(":");

		if (type.includes("(")) {
			const startOfBracket = type.indexOf("(");
			const endOfBracket = type.indexOf(")");

			component = type.slice(startOfBracket + 1, endOfBracket);
			type = type.slice(0, startOfBracket);
		}

		if (component.length) {
			component = component.charAt(0).toUpperCase() + component.slice(1);
			details = `**${component}**: ${details.trim()}`;
		}

		return { type, details: details.trim() };
	}
}
