import type { GitHubInstallation } from "@ijsblokje/octocat";
import { ApplyOptions, GitHubEvent } from "@ijsblokje/octocat";
import type { Octokit } from "@ijsblokje/octokit";
import type { EmitterWebhookEvent } from "@ijsblokje/server";
import { LABEL_CONFIG_LOCATION } from "@ijsblokje/utils/constants.js";
import type { Label } from "@ijsblokje/utils/types.js";
import _ from "lodash";

import { CreateLabel, DeleteLabel, UpdateLabel } from "./LabelSyncUtils.js";

@ApplyOptions({ event: "push" })
export default class extends GitHubEvent {
	public override async run(event: EmitterWebhookEvent<"push">, octokit: Octokit, installation?: GitHubInstallation) {
		if (!installation || !installation.defaultLabels) return;
		if (event.payload.repository.name !== (installation.isUser ? installation!.name : ".github")) return;

		if (event.payload.commits.some((commit) => (commit.removed ?? []).includes(LABEL_CONFIG_LOCATION))) {
			installation!.defaultLabels = [];
			installation!.labels.clear();

			return;
		}

		if (!event.payload.commits.some((commit) => [...(commit.added ?? []), ...(commit.modified ?? [])].includes(LABEL_CONFIG_LOCATION))) return;

		const labelConfig = await this.getLabelConfig(octokit, installation.name, event.payload.repository.name);
		if (!labelConfig) return;

		const owner = installation.name;
		installation.updateLabels(Buffer.from(labelConfig, "base64").toString());

		for (const repo of installation.configs.keys()) {
			const labels = [...installation.defaultLabels, ...(installation.labels.get(repo) ?? [])];
			const existingLbs = await octokit.request("GET /repos/{owner}/{repo}/labels", { owner, repo }).catch(() => ({ data: [] }));
			const existingLabels: Label[] = existingLbs.data.map((label) => ({
				name: label.name,
				description: label.description ?? "",
				color: `#${label.color}`
			}));

			const addLabels = labels.filter((label) => !existingLabels.find((l) => l.name === label.name)); // Labels that have to be created
			const removeLabels = existingLabels.filter((label) => !labels.find((l) => l.name === label.name)); // Labels that have to be deleted
			const commonLabels = labels.filter((label) => {
				const cLabel = existingLabels.find((l) => l.name === label.name);
				if (!cLabel) return false;
				return !_.isEqual(cLabel, label);
			}); // Labels that have to be updated

			await Promise.allSettled(removeLabels.map((label) => DeleteLabel(octokit, label.name, owner, repo)));
			await Promise.allSettled(addLabels.map((label) => CreateLabel(octokit, label.name, label.color, label.description, owner, repo)));
			await Promise.allSettled(commonLabels.map((label) => UpdateLabel(octokit, label.name, label.color, label.description, owner, repo)));
		}
	}

	private async getLabelConfig(octokit: Octokit, owner: string, repo: string) {
		try {
			const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
				owner,
				repo,
				path: LABEL_CONFIG_LOCATION
			});

			return "content" in response.data ? response.data.content : null;
		} catch (error) {
			octokit.logger.error(`[LabelSync(PushEvent)]: Failed to fetch label config content from ${owner}/${repo}`, error);
			return null;
		}
	}
}
