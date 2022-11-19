import { createRegExp, digit, oneOrMore } from "magic-regexp";
import parseLinkHeader from "parse-link-header";
import type ijsblokje from "../ijsBlokje.js";
import type { Action } from "./Action.js";

interface CommitData {
	type: string;
	message: string;
}

export class Changelog {
	public constructor(public bot: ijsblokje) {}

	private get semverRegex() {
		const major = oneOrMore(digit).groupedAs("major").and(".");
		const minor = oneOrMore(digit).groupedAs("minor").and(".");
		const patch = oneOrMore(digit).groupedAs("patch");

		return createRegExp(major.and(minor).and(patch));
	}

	public async run(ctx: Action.Context<"commit_comment.created">): Promise<string> {
		const headRef = ctx.payload.comment.commit_id;
		const { repo, owner } = ctx.repo();
		const { octokit } = ctx;

		const latestRelease = await octokit.repos.getLatestRelease({ repo, owner }).catch(() => null);
		let parsedCommits: CommitData[];
		if (latestRelease?.data) {
			const baseRef = latestRelease.data.tag_name;
			let commits = await octokit.repos.compareCommits({
				base: baseRef,
				head: headRef,
				per_page: 100,
				owner,
				repo
			});

			parsedCommits = commits.data.commits.map((commit) =>
				this.getCommitData(commit.commit.message, commit.sha, `https://github.com/${owner}/${repo}/commit/${commit.sha}`)
			);

			let page = 1;
			while (commits.data.commits.length >= 100) {
				try {
					commits = await octokit.repos.compareCommits({
						base: baseRef,
						head: headRef,
						per_page: 100,
						owner,
						repo,
						page
					});

					parsedCommits = commits.data.commits.map((commit) =>
						this.getCommitData(commit.commit.message, commit.sha, `https://github.com/${owner}/${repo}/commit/${commit.sha}`)
					);

					page++;
				} catch (err) {
					commits.data.commits.length = 0;
				}
			}
		} else {
			const commitsList = await octokit.repos.listCommits({ repo, owner });
			const parsedHeader = parseLinkHeader(commitsList.headers.link);

			const firstCommits = await octokit.repos.listCommits({ owner, repo, page: (parsedHeader?.last.page as number | undefined) ?? 1 });
			const firstCommit = firstCommits.data[firstCommits.data.length - 1];
			const baseRef = firstCommit.sha;

			let commits = await octokit.repos.compareCommits({
				base: baseRef,
				head: headRef,
				per_page: 100,
				owner,
				repo
			});

			parsedCommits = commits.data.commits.map((commit) =>
				this.getCommitData(commit.commit.message, commit.sha, `https://github.com/${owner}/${repo}/commit/${commit.sha}`)
			);

			let page = 1;
			while (commits.data.commits.length >= 100) {
				try {
					commits = await octokit.repos.compareCommits({
						base: baseRef,
						head: headRef,
						per_page: 100,
						owner,
						repo,
						page
					});

					parsedCommits = commits.data.commits.map((commit) =>
						this.getCommitData(commit.commit.message, commit.sha, `https://github.com/${owner}/${repo}/commit/${commit.sha}`)
					);

					page++;
				} catch (err) {
					commits.data.commits.length = 0;
				}
			}
		}

		const changelog = this.getMarkdown(parsedCommits);
		return changelog;
	}

	public getVersion(ctx: Action.Context<"commit_comment.created">): string | null {
		const message = ctx.payload.comment.body;
		const res = this.semverRegex.exec(message);

		return res?.[0] ?? null;
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
