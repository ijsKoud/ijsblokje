import { WEBHOOK_EVENTS } from "../../../lib/constants.js";
import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";

@ApplyActionOptions({
	events: ["repository"]
})
export default class WebhookSync extends Action {
	public async run(ctx: Action.Context<"repository">) {
		const repo = ctx.repo();

		const webhook = process.env[`${repo.owner.toUpperCase()}_WEBHOOK_URL`];
		if (!webhook) return;

		if (ctx.payload.action === "created") {
			const active = !ctx.payload.repository.private;
			await ctx.octokit.repos.createWebhook({
				...repo,
				config: { url: webhook, content_type: "json" },
				events: WEBHOOK_EVENTS,
				active
			});

			return;
		}

		if (!["privatized", "publicized"].includes(ctx.payload.action)) return;
		const active = ctx.payload.action === "publicized" ? true : false;
		const hookData = await ctx.octokit.repos.listWebhooks(repo);
		const hook = hookData.data.find((wh) => wh.config.url === webhook);
		if (!hook) return;

		await ctx.octokit.repos.updateWebhook({
			...repo,
			hook_id: hook.id,
			active
		});
	}
}
