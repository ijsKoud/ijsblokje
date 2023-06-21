import { Octokit, type OctokitOptions } from "../src/index.js";

/** Checks whether the input is a class or not */
function isClass(input: unknown) {
	return typeof input === "function" && typeof input.prototype === "object";
}

describe("Octokit", () => {
	test("Octokit should be a class", () => {
		expect(isClass(Octokit)).toBe(true);
	});

	const baseOptions: OctokitOptions = {
		appId: 15483,
		clientId: "",
		clientSecret: "",
		privateKey: "-----BEGIN RSA PRIVATE KEY-----\ntest test test\n-----END RSA PRIVATE KEY-----"
	};

	test("Without installationId", () => {
		const octokit = new Octokit(baseOptions);
		expect(octokit.options).toStrictEqual(baseOptions);

		expect(octokit.userAgent).toBe("@ijsblokje/octokit (https://github.com/ijsKoud/ijsblokje)");
		expect(typeof octokit.request === "function").toBe(true);
		expect(typeof octokit.hook === "function").toBe(true);
		expect(typeof octokit.graphql === "function").toBe(true);
		expect(typeof octokit.log === "object").toBe(true);
	});

	test("With installationId", () => {
		const options: OctokitOptions = { ...baseOptions, installationId: 11150 };
		const octokit = new Octokit(options);
		expect(octokit.options).toStrictEqual(options);
	});

	test("Octokit#new()", () => {
		const octokit = new Octokit(baseOptions);
		const clonedOctokit = octokit.new();

		expect(clonedOctokit instanceof Octokit).toBe(true);
		expect(clonedOctokit.options).toStrictEqual(baseOptions);
	});
});
