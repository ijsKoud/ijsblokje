import type { Commit, CommitType } from "./Commit.js";

export class Changelog {
	/** The list of commits for this changelog */
	public readonly commits: Commit[];

	public constructor(commits: Commit[]) {
		this.commits = commits;
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
			const message = parsed.breaking ? `${changelogMessage} **💥 breaking change**` : changelogMessage;
			const commitSha = `(${commit.sha.name})[${commit.sha.url}]`;

			categories[parsed.type] ??= [];
			categories[parsed.type]!.push(`- ${message} (${commitSha})`);
		}

		const categoryKeys = Object.keys(categories) as CommitType[];
		const categoryContent = categoryKeys
			.sort((a, b) => ChangelogPosition[a] - ChangelogPosition[b])
			.map((key) => `## ${ChangelogScope[key]}\n${categories[key]!.join("\n")}`)
			.join("\n\n");

		const message = Boolean(additionalMessage) ? `${additionalMessage}\n` : "";
		return [`# Release v${version} 🎉`, message, categoryContent].join("\n");
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

export enum ChangelogPosition {
	feat,
	fix,
	revert,

	refactor,
	perf,
	types,

	chore,
	docs,
	build,

	style,
	test,
	ci
}
