import semver from "semver";
import type { Commit, CommitParserResult } from "./Commit.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class VersionBump {
	public static patchScopes = ["chore", "build", "ci", "docs", "fix", "perf", "refactor", "style", "test", "types"];
	public static minorScopes = ["feat", "revert"];

	/**
	 * Bumps the provided version by looking at the provided commits
	 * @param commits The commits to check
	 * @param version The current version
	 * @returns
	 */
	public static getNewVersion(commits: Commit[], version: string) {
		const cleanVersion = semver.clean(version);
		if (!cleanVersion) return null;

		const bumpType = this.getBumpType(commits);
		const newVersion = semver.inc(cleanVersion, bumpType);

		return newVersion;
	}

	/**
	 * Returns the bump type by checking the commits
	 * @param commits The commits to check
	 * @returns
	 */
	public static getBumpType(commits: Commit[]): VersionBumpType {
		const parsed = commits.map((commit) => commit.parse()).filter(Boolean) as CommitParserResult[];
		if (parsed.some((commit) => commit.breaking)) return "major";
		if (parsed.some((commit) => this.minorScopes.includes(commit.type))) return "minor";

		return "patch";
	}

	/**
	 * Bumps the package json version
	 * @param version The version to go to
	 * @param packageJson The package json to bump
	 * @returns
	 */
	public static bumpJavaScript(version: string, packageJson: string) {
		const json = JSON.parse(packageJson);
		if ("version" in json && typeof json.version === "string") json.version = version;

		return JSON.stringify(json);
	}
}

export type VersionBumpType = "patch" | "minor" | "major";
