import type { Probot } from "probot";
import { WEBHOOK_EVENTS, WEBHOOK_URL } from "../../lib/constants";

export const Webhook = (app: Probot) => {
	app.on("repository.created", async (ctx) => {
		const repo = ctx.repo();
		await ctx.octokit.repos.createWebhook({
			...repo,
			active: ctx.payload.repository.public ?? true,
			events: WEBHOOK_EVENTS,
			config: {
				url: WEBHOOK_URL,
				content_type: "application/json"
			}
		});
	});

	app.on(["repository.publicized", "repository.privatized"], async (ctx) => {
		const repo = ctx.repo();
		const existing = await ctx.octokit.repos.listWebhooks(repo);
		const active = ctx.payload.action === "publicized" ? true : false;

		const webhook = existing.data.find((wh) => wh.url === WEBHOOK_URL);
		if (webhook)
			await ctx.octokit.repos.updateWebhook({
				...repo,
				hook_id: webhook.id,
				active
			});
	});
};
