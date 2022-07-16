import { DEPENDENCIES_LABEL_NAME, USERNAME } from "../../lib/constants";
import type { Ijsblokje } from "../ijsblokje";

export const Label = (bot: Ijsblokje) => {
	const app = bot.probot.probotApp;

	app.on("pull_request.opened", async (ctx) => {
		if (ctx.payload.pull_request.user.login !== "renovate[bot]") return;
		await ctx.octokit.issues.addLabels({
			owner: USERNAME,
			repo: ctx.payload.repository.name,
			issue_number: ctx.payload.number,
			labels: [DEPENDENCIES_LABEL_NAME]
		});
	});
};
