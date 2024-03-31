import EventSource from "eventsource";

import { Server } from "../src/index.js";

/** Checks whether the input is a class or not */
function isClass(input: unknown) {
	return typeof input === "function" && typeof input.prototype === "object";
}

describe("Server", () => {
	test("Server should be a class", () => {
		expect(isClass(Server)).toBe(true);
	});

	test("url constructor", () => {
		const server = new Server({ urlOrPort: "http://localhost:3000", secret: "test" });
		expect(server.source).toBeInstanceOf(EventSource);
	});

	test("port constructor", () => {
		const server = new Server({ urlOrPort: 3000, secret: "test" });
		expect(server.source).toBeTypeOf("function");
	});
});
