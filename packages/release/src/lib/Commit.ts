import type { Endpoints } from "@octokit/types";

export class Commit {
	public constructor(public data: GitHubCommit) {}

	public parse(): CommitParserResult | null {
		const commitRegex =
			/^(?<type>build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test|types|¯\\_\(ツ\)_\/¯)(?<scope>\(\w+\)?((?=:\s)|(?=!:\s)))?(?<breaking>!)?(?<subject>:\s.*)?|^(?<merge>Merge \w+)/gm;
		const [message] = this.data.commit.message.split("\n");

		const parsed = commitRegex.exec(message);
		if (!parsed?.groups) return null;

		const { type, scope, breaking, subject, merge } = parsed.groups;
		if (!type || !subject) return null;

		const commitMessage = Boolean(merge) ? merge : subject.slice(2);
		return {
			type: type as CommitType,
			scope: scope?.slice(1, -1),
			message: commitMessage.trim(),
			breaking: Boolean(breaking),
			merge: Boolean(merge)
		};
	}
}

export interface CommitParserResult {
	type: CommitType;
	scope: string;
	message: string;
	breaking: boolean;
	merge: boolean;
}

export type CommitType = "build" | "chore" | "ci" | "docs" | "feat" | "fix" | "perf" | "refactor" | "revert" | "style" | "test" | "types";
export type GitHubCommit = Endpoints["GET /repos/{owner}/{repo}/compare/{base}...{head}"]["response"]["data"]["commits"][0];
