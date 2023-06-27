import { Changelog, Commit } from "../src/index.js";
import { fixScopeMockCommit, fixMockCommit, featBreakingMockCommit, featScopeMockCommit } from "./mockdata.js";

/** Checks whether the input is a class or not */
function isClass(input: unknown) {
	return typeof input === "function" && typeof input.prototype === "object";
}

describe("Changelog", () => {
	test("Changelog should be a class", () => {
		expect(isClass(Changelog)).toBe(true);
	});

	const commitsRaw = [fixScopeMockCommit, fixMockCommit, featScopeMockCommit, featBreakingMockCommit];
	const commits = commitsRaw.map((commit) => new Commit(commit));

	const messagelessChangelog = [
		"# Release v1.0.0 🎉",
		"",
		"## ✨ Features",
		"- **Manager**: add better caching ([6dcb09b](https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e))",
		"- **Manager**: add better caching **💥 breaking change** ([6dcb09b](https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e))",
		"",
		"## 🐛 Bug Fixes",
		"- **Manager**: all the bugs ([6dcb09b](https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e))",
		"- all the bugs ([6dcb09b](https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e))"
	].join("\n");

	const messageChangelog = [
		"# Release v1.0.0 🎉",
		"This is a message!",
		"",
		"## ✨ Features",
		"- **Manager**: add better caching ([6dcb09b](https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e))",
		"- **Manager**: add better caching **💥 breaking change** ([6dcb09b](https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e))",
		"",
		"## 🐛 Bug Fixes",
		"- **Manager**: all the bugs ([6dcb09b](https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e))",
		"- all the bugs ([6dcb09b](https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e))"
	].join("\n");

	test("constructor", () => {
		const changelog = new Changelog(commits);
		expect(changelog.commits).toStrictEqual(commits);
	});

	test("changelog#getMarkdown() without additional message", () => {
		const changelog = new Changelog(commits);
		expect(changelog.getMarkdown("1.0.0")).toEqual(messagelessChangelog);
	});

	test("changelog#getMarkdown() with additional message", () => {
		const changelog = new Changelog(commits);
		expect(changelog.getMarkdown("1.0.0", "This is a message!")).toEqual(messageChangelog);
	});
});
