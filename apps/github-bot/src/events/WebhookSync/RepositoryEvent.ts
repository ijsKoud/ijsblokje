import { ApplyOptions, GitHubEvent, GitHubInstallation } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";
import requestWithPagination from "@ijsblokje/utils/RequestWithPagination.js";
import { WEBHOOK_EVENTS } from "@ijsblokje/utils/constants.js";

@ApplyOptions({ event: "repository" })
export default class extends GitHubEvent {
	public override async run(
		event: EmitterWebhookEvent<"repository.created" | "repository.privatized" | "repository.publicized">,
		octokit: Octokit,
		installation?: GitHubInstallation
	) {
		if (!installation) return;

		const webhook = process.env[`${installation.name.toUpperCase()}_WEBHOOK_URL`];
		const secret = process.env[`${installation.name.toUpperCase()}_WEBHOOK_SECRET`];
		if (!webhook) return;

		const owner = installation.name;
		const repo = event.payload.repository.name;

		if (event.payload.action === "created") {
			const active = !event.payload.repository.private;
			await octokit.request("POST /repos/{owner}/{repo}/hooks", {
				owner,
				repo,
				active,
				config: { url: webhook, secret, content_type: "json" },
				events: WEBHOOK_EVENTS
			});

			return;
		}

		if (!["privatized", "publicized"].includes(event.payload.action)) return;
		const active = event.payload.action === "publicized" ? true : false;
		const hooks = await this.getHooks(octokit, owner, repo);
		const hook = hooks.find((wh) => wh.config.url === webhook);
		if (!hook) return;

		await octokit.request("PATCH /repos/{owner}/{repo}/hooks/{hook_id}", {
			hook_id: hook.id,
			owner,
			repo,
			active
		});
	}

	private async getHooks(octokit: Octokit, owner: string, repo: string) {
		const request = (page: number) =>
			octokit.request("GET /repos/{owner}/{repo}/hooks", { owner, repo, page, per_page: 100 }).then((data) => data.data);
		const check = (hooks: Awaited<ReturnType<typeof request>>) => hooks.length === 100;

		const hooks = await requestWithPagination(request, check);
		return hooks.reduce((a, b) => [...a, ...b]);
	}
}
