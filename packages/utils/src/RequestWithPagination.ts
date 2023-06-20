import type { Awaitable } from "./types.js";

/**
 * Handle the pagination of an Octokit request
 * @param request The function to call everytime we need to fetch more data
 * @param check The function to check if we reached the desired amount or not
 * @param initialPage The initial page (defaults to 1)
 * @returns
 */
async function requestWithPagination<R>(
	request: RequestWithPaginationRequest<R>,
	check: RequestWithPaginationCheck<R>,
	initialPage?: number
): Promise<R[]> {
	const data: R[] = [];
	let page = initialPage ?? 1;

	let response = await request(page);
	data.push(response);

	while (check(response)) {
		page++;
		response = await request(page);
		data.push(response);
	}

	return data;
}

export type RequestWithPaginationRequest<R> = (page: number) => Awaitable<R>;
export type RequestWithPaginationCheck<R> = (response: R) => boolean;

export default requestWithPagination;
