import type ijsblokje from "../ijsBlokje.js";
import type { EventPayloadMap } from "@octokit/webhooks-types";
import type { Awaitable } from "../types.js";

export class Action {
	public constructor(public bot: ijsblokje, public options: Action.Options) {}

	public run<K extends keyof EventPayloadMap>(payload: EventPayloadMap[K]): Awaitable<any> {
		// placeholder
	}
}

export interface ActionOptions {
	event: keyof EventPayloadMap;
}

export namespace Action {
	export type Options = ActionOptions;
}
