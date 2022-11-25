import { GH_OWNER } from "../../../lib/constants.js";
import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";

@ApplyActionOptions({
	events: ["issue_comment"]
})
export default class NpmForPRs extends Action {
	public async run(ctx: Action.Context<"issue_comment">) {
		if (ctx.payload.comment.user.login !== GH_OWNER) return;
		if (ctx.payload.action !== "created" && !Boolean(ctx.payload.issue.draft)) return;
		if (ctx.payload.comment.body !== `@${process.env.BOT_NAME} npm release-dev`) return;

		const prData = await ctx.octokit.pulls.get(ctx.pullRequest());
		const repo = ctx.repo({ ref: "main" });
		const { number } = ctx.payload.issue;

		await ctx.octokit.actions.createWorkflowDispatch({
			...repo,
			workflow_id: "continuous-delivery.yml",
			inputs: {
				prNumber: number.toString(),
				ref: prData.data.head.ref
			}
		});

		await ctx.octokit.issues.createComment({
			...repo,
			issue_number: number,
			body: [
				"## Workflow started ✅",
				`You can install the package using \`yarn add @${repo.owner}/${repo.repo}@pr-${number}\` in a couple of minutes.`
			].join("\n")
		});
	}
}
