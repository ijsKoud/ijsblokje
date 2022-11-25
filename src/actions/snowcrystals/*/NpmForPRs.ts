import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";

@ApplyActionOptions({
	events: ["issue_comment", "workflow_run"]
})
export default class NpmForPRs extends Action {
	public async run(ctx: Action.Context<"issue_comment" | "workflow_run">) {
		if (ctx.name === "issue_comment") {
			await this.pullRequest(ctx as any);
			return;
		}

		// todo: code;
		ctx;
	}

	private async pullRequest(ctx: Action.Context<"issue_comment">) {
		if (ctx.payload.action !== "created" && !Boolean(ctx.payload.issue.draft)) return;
		await ctx;
	}
}
