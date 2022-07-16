import { WEBHOOK_EVENTS, WEBHOOK_URL } from "../../lib/constants";
import type { Ijsblokje } from "../ijsblokje";

export const Webhook = (bot: Ijsblokje) => {
	const app = bot.probot.probotApp;

	app.on("repository.created", async (ctx) => {
		const repo = ctx.repo();
		await ctx.octokit.repos.createWebhook({
			...repo,
			active: !ctx.payload.repository.private,
			events: WEBHOOK_EVENTS,
			config: {
				url: WEBHOOK_URL,
				content_type: "json"
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
