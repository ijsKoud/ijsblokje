import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";
import type { Label } from "../../../lib/types.js";
import _ from "lodash";
import { bold } from "colorette";

@ApplyActionOptions({
	events: ["push", "repository"]
})
export default class ReadmeSync extends Action {
	public async run(ctx: Action.Context<"push" | "repository">) {
		if (ctx.name === "push") await this.pushEvent(ctx as any);
		else if ((ctx as any as Action.Context<"repository">).payload.action === "created") await this.repoEvent(ctx as any);
	}

	private async pushEvent(ctx: Action.Context<"push">) {
		const repo = ctx.repo();
		if (repo.owner !== repo.repo || !ctx.payload.commits.some((commit) => commit.modified.includes("config/labels.json"))) return;

		await this.bot.DataHandler.updateLabelsList();

		const labelsCollection = this.bot.DataHandler.labels;
		const globalLabels = labelsCollection.get("global") ?? [];
		const repos = this.bot.DataHandler.repos.filter((repo) => !repo.archived);
		for (const repository of repos) {
			const labels = [...globalLabels, ...(labelsCollection.get(`${repository.owner}/${repository.repo}`) ?? [])];
			const { data: existingLbs } = await ctx.octokit.request("GET /repos/{owner}/{repo}/labels", {
				repo: repository.repo,
				owner: repository.owner
			});

			const existingLabels: Label[] = existingLbs.map((label) => ({
				name: label.name,
				description: label.description ?? "",
				color: `#${label.color}`
			}));

			const addLabels = labels.filter((label) => !existingLabels.find((l) => l.name === label.name));
			const removeLabels = existingLabels.filter((label) => !labels.find((l) => l.name === label.name));
			const commonLabels = labels.filter((label) => {
				const cLabel = existingLabels.find((l) => l.name === label.name);
				if (!cLabel) return false;
				return !_.isEqual(cLabel, label);
			});

			await Promise.allSettled(
				removeLabels.map((label) => ctx.octokit.issues.deleteLabel({ name: label.name, owner: repository.owner, repo: repository.repo }))
			);
			await Promise.allSettled(
				addLabels.map((label) =>
					ctx.octokit.issues.createLabel({
						...label,
						color: label.color.replace("#", ""),
						owner: repository.owner,
						repo: repository.repo
					})
				)
			);
			await Promise.allSettled(
				commonLabels.map((label) =>
					ctx.octokit.issues.updateLabel({
						...label,
						color: label.color.replace("#", ""),
						owner: repository.owner,
						repo: repository.repo
					})
				)
			);

			this.bot.logger.debug(
				`[LabelSync]: Updated ${commonLabels.length}, removed ${removeLabels.length} & created ${addLabels.length} labels for ${bold(
					`${repository.owner}/${repository.repo}\n`
				)}`,
				JSON.stringify(commonLabels),
				JSON.stringify(removeLabels),
				JSON.stringify(addLabels)
			);
		}
	}

	private async repoEvent(ctx: Action.Context<"repository.created">) {
		// todo: code
	}
}
