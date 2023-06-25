import { VersionBump, Commit } from "../src/index.js";
import { fixScopeMockCommit, fixMockCommit, featBreakingMockCommit, featScopeMockCommit, mockPackageJson } from "./mockdata.js";

/** Checks whether the input is a class or not */
function isClass(input: unknown) {
	return typeof input === "function" && typeof input.prototype === "object";
}

describe("VersionBump", () => {
	test("VersionBump should be a class", () => {
		expect(isClass(VersionBump)).toBe(true);
	});

	const commitsPatchRaw = [fixScopeMockCommit, fixMockCommit];
	const commitsMinorRaw = [...commitsPatchRaw, featScopeMockCommit];
	const commitsMajorRaw = [...commitsMinorRaw, featBreakingMockCommit];

	const commitsPatch = commitsPatchRaw.map((commit) => new Commit(commit));
	const commitsMinor = commitsMinorRaw.map((commit) => new Commit(commit));
	const commitsMajor = commitsMajorRaw.map((commit) => new Commit(commit));

	test("parse: patch", () => {
		const newVersion = VersionBump.getNewVersion(commitsPatch, "1.0.0");
		expect(newVersion).toBe("1.0.1");
	});

	test("parse: minor", () => {
		const newVersion = VersionBump.getNewVersion(commitsMinor, "1.0.0");
		expect(newVersion).toBe("1.1.0");
	});

	test("parse: major", () => {
		const newVersion = VersionBump.getNewVersion(commitsMajor, "1.0.0");
		expect(newVersion).toBe("2.0.0");
	});

	test("bumpJavaScript", () => {
		const bumpedPkgJson = VersionBump.bumpJavaScript("1.0.0", JSON.stringify(mockPackageJson));
		expect(bumpedPkgJson).toBe(JSON.stringify(mockPackageJson).replace("0.0.0", "1.0.0"));
	});
});
