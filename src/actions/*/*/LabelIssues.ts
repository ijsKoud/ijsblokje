import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";
import { COMMIT_REGEX, COMMIT_TYPES, LABEL_ISSUES_EVENTS } from "../../../lib/constants.js";

@ApplyActionOptions({
	events: ["issues", "pull_request"]
})
export default class LabelIssues extends Action {
	public async run(ctx: Action.Context<"issues" | "pull_request">) {
		const repo = ctx.repo();

		if (!LABEL_ISSUES_EVENTS.includes(ctx.payload.action)) return;
		if (ctx.name === "pull_request" && ctx.payload.sender.login === "renovate[bot]") {
			const gLabels = this.bot.DataHandler.labels.get(`${repo.owner}-global`)!;
			const label = gLabels.find((l) => l.name.toLowerCase().includes("dependencies"));
			if (label)
				await ctx.octokit.issues.addLabels({
					...repo,
					issue_number: (ctx as any as Action.Context<"pull_request">).payload.pull_request.number,
					labels: [label.name]
				});
		}

		const title = "pull_request" in ctx.payload ? ctx.payload.pull_request.title : ctx.payload.issue.title;
		const labels = "pull_request" in ctx.payload ? ctx.payload.pull_request.labels ?? [] : ctx.payload.issue.labels ?? [];
		const issue = "pull_request" in ctx.payload ? ctx.payload.pull_request.number : ctx.payload.issue.number;

		const conventionalCommitRes = COMMIT_REGEX.exec(title);
		COMMIT_REGEX.lastIndex = 0;

		const type = conventionalCommitRes?.groups!.type ?? "";
		if (!COMMIT_TYPES.some((l) => title.startsWith(l))) return;

		const gLabels = this.bot.DataHandler.labels.get(`${repo.owner}-global`)!;
		const label = gLabels.find((l) => l.name.toLowerCase().includes(type));

		const existingCommitLabels = labels.filter((label) => COMMIT_TYPES.some((t) => label.name.toLowerCase().includes(t)));
		const filteredLabels = existingCommitLabels.filter((l) => l.name !== label?.name);
		if (label && !existingCommitLabels.some((l) => l.name !== label?.name))
			await ctx.octokit.issues.addLabels({ ...repo, issue_number: issue, labels: [label.name] });
		if (filteredLabels.length)
			await Promise.all(
				filteredLabels
					.filter((lb) => !lb.name.toLowerCase().includes("dependencies"))
					.map((label) => ctx.octokit.issues.removeLabel({ issue_number: issue, name: label.name, ...repo }))
			);
	}
}
