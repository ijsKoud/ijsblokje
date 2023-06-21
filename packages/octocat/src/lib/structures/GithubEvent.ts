import type { EmitterWebhookEvent, EmitterWebhookEventName } from "@ijsblokje/server";
import type { Awaitable } from "@ijsblokje/utils/types.js";
import type { Octocat } from "../Octocat.js";
import type { GitHubInstallation } from "./GitHubInstallation.js";

export abstract class GitHubEvent<Event extends EmitterWebhookEventName> {
	/** The octocat instance */
	public octocat!: Octocat;

	/** The event name that this instance is handling */
	public readonly event: EmitterWebhookEventName;

	public constructor(options: GitHubEventOptions<Event>) {
		this.event = options.event;
	}

	/**
	 * The function which handles the GitHub event
	 * @param event The event data
	 * @param installation The installation that triggered this event
	 */
	public run(event: EmitterWebhookEvent<Event>, installation: GitHubInstallation): Awaitable<void> {
		console.error(`GitHubEvent#run() is not overwritten!\nInstallation: ${installation.name}\nEvent: ${this.event}`);
	}

	/**
	 * Function runs when the event is first loaded
	 * @param octocat The octocat instance
	 * @requires ```js
	 * super.load(octocat)
	 * ```
	 * call when overwriting the function
	 */
	public load(octocat: Octocat) {
		this.octocat = octocat;
	}
}

interface GitHubEventOptions<Event extends EmitterWebhookEventName> {
	event: Event;
}
