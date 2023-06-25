import type { GitHubEventOptions } from "./structures/GithubEvent.js";

type Constructor<T = Record<string, any>> = new (...args: any[]) => T;

/**
 * A way to configure the GitHubEvent classes
 * @example
 * ```ts
 * ‎@applyOptions({ event: "ping" })
 * export default class extends GitHubEvent {
 * 	public run(event, installation) {
 * 		// Your route code here
 * 	}
 * }
 * ```
 */
export function ApplyOptions(options: GitHubEventOptions) {
	return <Class extends Constructor>(Target: Class) =>
		class extends Target {
			public constructor(...args: any[]) {
				super(options, ...args);
			}
		};
}
