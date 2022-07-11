import type { Probot } from "probot";
import { WEBHOOK_URL, WEBHOOK_EVENTS } from "../constants";

export const Webhook = (app: Probot) => {
	app.on("repository.renamed", async (ctx) => {
		const repo = ctx.repo();
		await ctx.octokit.repos.createWebhook({
			...repo,
			active: true,
			events: WEBHOOK_EVENTS,
			config: {
				url: WEBHOOK_URL,
				content_type: "application/json"
			}
		});
	});
};
