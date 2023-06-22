import { Commit, type CommitParserResult } from "../src/index.js";
import { fixScopeMockCommit, fixMockCommit, featBreakingMockCommit } from "./mockdata.js";

/** Checks whether the input is a class or not */
function isClass(input: unknown) {
	return typeof input === "function" && typeof input.prototype === "object";
}

describe("Commit", () => {
	test("Commit should be a class", () => {
		expect(isClass(Commit)).toBe(true);
	});

	test("constructor", () => {
		const commit = new Commit(fixMockCommit);
		expect(commit.data).toStrictEqual(fixMockCommit);
	});

	test("parse: scope", () => {
		const commit = new Commit(fixScopeMockCommit);
		expect(commit.parse()).toStrictEqual<CommitParserResult>({
			breaking: false,
			merge: false,
			message: "all the bugs",
			type: "fix",
			scope: "Manager"
		});
	});

	test("parse: breaking", () => {
		const commit = new Commit(featBreakingMockCommit);
		expect(commit.parse()).toStrictEqual<CommitParserResult>({
			breaking: true,
			merge: false,
			message: "add better caching",
			type: "feat",
			scope: "Manager"
		});
	});

	test("sha", () => {
		const commit = new Commit(featBreakingMockCommit);
		expect(commit.sha).toStrictEqual({
			name: "6dcb09b",
			url: "https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e"
		});
	});
});
