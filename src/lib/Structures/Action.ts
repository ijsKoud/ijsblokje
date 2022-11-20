import type ijsblokje from "../ijsBlokje.js";
import type { EmitterWebhookEventName as WebhookEvents } from "@octokit/webhooks";
import type { Awaitable } from "../types.js";
import type { Context as ProbotContext } from "probot";

export class Action {
	public constructor(public bot: ijsblokje, public options: Action.Options) {
		if (!options?.events) throw new Error("Action without a valid event type");
	}

	public run(ctx: any): Awaitable<any> {
		// placeholder
	}
}

export interface ActionOptions {
	events: WebhookEvents[];
}

export namespace Action {
	export type Options = ActionOptions;
	export type Context<K extends WebhookEvents = WebhookEvents> = ProbotContext<K>;
}
