import type { Octokit } from "@ijsblokje/octokit";
import type { Commit, CommitType } from "./Commit.js";

export class Changelog {
	/** The list of commits for this changelog */
	public readonly commits: Commit[];

	/** The octokit instance with an authenticated installation token */
	public readonly octokit: Octokit;

	public constructor(commits: Commit[], octokit: Octokit) {
		this.commits = commits;
		this.octokit = octokit;
	}

	/**
	 * Generates the changelog in markdown
	 * @param version The new version
	 * @param additionalMessage An additional message that is appended to the changelog
	 * @returns
	 */
	public getMarkdown(version: string, additionalMessage = "") {
		const categories: Partial<Record<CommitType, string[]>> = {};
		for (const commit of this.commits) {
			const parsed = commit.parse();
			if (!parsed) continue;

			const changelogMessage = parsed.scope ? `**${parsed.scope}**: ${parsed.message}` : parsed.message;
			const commitSha = `(${commit.sha.name})[${commit.sha.url}]`;

			categories[parsed.type] ??= [];
			categories[parsed.type]!.push(`- ${changelogMessage} (${commitSha})`);
		}

		const categoryKeys = Object.keys(categories) as CommitType[];
		const categoryContent = categoryKeys.map((key) => `## ${key}\n${categories[key]!.join("\n")}`).join("\n\n");

		return `# Release v${version} 🎉\n${additionalMessage}\n${categoryContent}`;
	}
}

export enum ChangelogScope {
	build = "🛠 Builds",
	chore = "♻️ chores",
	ci = "⚙️ Continuous Integration",
	docs = "📚 Documentation",
	feat = "✨ Features",
	fix = "🐛 Bug Fixes",
	perf = "🚀 Performance Improvements",
	refactor = "📦 Code Refactoring",
	revert = "🗑 Reverts",
	style = "💎 Styles",
	test = "🧪 Tests",
	types = "🚨 Typings"
}
