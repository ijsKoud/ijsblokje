import RequestWithPagination from "../src/RequestWithPagination.js";

describe("RequestWithPagination", () => {
	test("RequestWithPagination should be a function", () => {
		expect(typeof RequestWithPagination === "function").toBe(true);
	});

	const mockdata = [
		["apple", "banana", "orange", "grape"],
		["car", "bicycle", "motorcycle", "bus"],
		["dog", "cat", "horse", "bird"],
		["chair", "table", "sofa", "desk"],
		["sun", "moon", "stars", "cloud"],
		["book", "pen", "paper", "pencil"],
		["computer", "keyboard", "mouse", "monitor"],
		["guitar", "piano", "drums", "violin"],
		["pizza", "hamburger", "sushi", "pasta"],
		["football", "basketball", "tennis", "soccer"]
	];

	test("sync run", async () => {
		const request = (page: number) => mockdata[page];
		const check = (data: string[]) => mockdata.indexOf(data) + 1 !== mockdata.length;
		const results = await RequestWithPagination(request, check, 0);

		expect(results).toStrictEqual(mockdata);
	});
});
