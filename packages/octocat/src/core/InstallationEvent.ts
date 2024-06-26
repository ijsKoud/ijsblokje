import type { EmitterWebhookEvent } from "@ijsblokje/server";

import { ApplyOptions, GitHubEvent } from "../index.js";

@ApplyOptions({ event: "installation" })
export default class extends GitHubEvent {
	public override async run(event: EmitterWebhookEvent<"installation">) {
		switch (event.payload.action) {
			case "created":
			case "unsuspend":
				await this.create(event as any);
				break;
			case "deleted":
			case "suspend":
				this.octocat.installations.cache.delete(event.payload.installation.id);
				break;
			case "new_permissions_accepted":
				break;
		}
	}

	/**
	 * Registers the new installation
	 * @param event The installation.create event data
	 */
	private async create(event: EmitterWebhookEvent<"installation.created" | "installation.suspend">) {
		const manager = this.octocat.installations;
		const name = event.payload.installation.account
			? "login" in event.payload.installation.account
				? event.payload.installation.account.login
				: event.payload.installation.account?.name
			: "";
		if (manager.allowedInstallations && !manager.allowedInstallations.includes(name)) return;

		await manager.loadInstallation(event.payload.installation as any);
	}
}
