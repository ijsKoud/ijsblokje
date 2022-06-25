import type { Probot } from "probot";
import { DEPENDENCIES_LABEL_NAME, REPO_NAME, USERNAME } from "./constants";
import axios from "axios";
import type { iHeadCommit, LabelSyncFile, ListRepoRes } from "./types";

const run = (app: Probot) => {
	app.on("push", async (ctx) => {
		// ignore repositories which aren't called ijsKoud/ijsKoud
		if (ctx.payload.repository.full_name !== REPO_NAME) return;
		if (!(ctx.payload.head_commit as unknown as iHeadCommit).modified.includes("labels.json")) return;

		// get new label data
		const url = `https://api.github.com/repos/${REPO_NAME}/contents/labels.json`;
		const _data = await axios.get<{ content: string }>(url).catch(() => null);
		if (!_data) return console.error("[LABEL SYNC]: Unable to get updated label data.");

		const data = JSON.parse(Buffer.from(_data.data.content, "base64").toString("utf8")) as LabelSyncFile;
		const labels = data.labels.map((label) => ({ ...label, color: label.color.replace("#", "") }));
		const repos: ListRepoRes[] = [];
		let page = 2;
		let res = await ctx.octokit.repos.listForUser({ username: USERNAME });
		// @ts-ignore some types do not match but doesn't really matter
		repos.push(...res.data);

		while (res.data.length === 100) {
			res = await ctx.octokit.repos.listForUser({ username: USERNAME, page });

			// @ts-ignore some types do not match but doesn't really matter
			repos.push(...res.data);
			page++;
		}

		const validRepos = repos.filter((rep) => !rep.archived);
		for await (const repo of validRepos) {
			const existingLabels = await ctx.octokit.issues.listLabelsForRepo({ owner: USERNAME, repo: repo.name });
			const addLabels = labels.filter((label) => !existingLabels.data.find((l) => l.name === label.name));
			const removeLabels = existingLabels.data.filter((label) => !labels.find((l) => l.name === label.name));
			const commonLabels = labels.filter((label) => {
				const cLabel = existingLabels.data.find((l) => l.name === label.name);
				if (!cLabel) return false;

				if (cLabel.color !== label.color) return true;
				if (cLabel.description !== label.description) return true;

				return false;
			});

			removeLabels.forEach((label) => ctx.octokit.issues.deleteLabel({ owner: USERNAME, repo: repo.name, name: label.name }));
			addLabels.forEach((label) => ctx.octokit.issues.createLabel({ owner: USERNAME, repo: repo.name, ...label }));
			commonLabels.forEach((label) => ctx.octokit.issues.updateLabel({ owner: USERNAME, repo: repo.name, ...label }));
		}
	});

	app.on("pull_request.opened", async (ctx) => {
		if (ctx.payload.pull_request.user.login !== "renovate[bot]") return;
		await ctx.octokit.issues.addLabels({
			owner: USERNAME,
			repo: ctx.payload.repository.name,
			issue_number: ctx.payload.pull_request.id,
			labels: [DEPENDENCIES_LABEL_NAME]
		});
	});
};

export default run;
