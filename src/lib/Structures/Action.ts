import type ijsblokje from "../ijsBlokje.js";
import type { EventPayloadMap } from "@octokit/webhooks-types";

export class Action {
	public constructor(public bot: ijsblokje) {}
}

export interface ActionOptions {
	event: keyof EventPayloadMap;
}

export namespace Action {
	export type Options = ActionOptions;
}
