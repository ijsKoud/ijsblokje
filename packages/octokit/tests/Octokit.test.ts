import { Logger } from "@snowcrystals/icicle";

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
		privateKey: "-----BEGIN RSA PRIVATE KEY-----\ntest test test\n-----END RSA PRIVATE KEY-----",
		logger: new Logger({ parser: { color: true }, name: "Octokit" })
	};

	test("Without installationId", () => {
		const octokit = new Octokit(baseOptions);
		expect(octokit.options).toStrictEqual(baseOptions);

		expect(octokit.userAgent).toBe("@ijsblokje/octokit (https://github.com/ijsKoud/ijsblokje)");
		expect(octokit.request).toBeTypeOf("function");
		expect(octokit.hook).toBeTypeOf("function");
		expect(octokit.graphql).toBeTypeOf("function");
		expect(octokit.log).toBeTypeOf("object");
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
