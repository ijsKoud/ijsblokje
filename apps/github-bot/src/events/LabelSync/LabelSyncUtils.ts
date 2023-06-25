import type { Octokit } from "@ijsblokje/octokit";

/**
 * Deletes a label and handles rejections if any
 * @param octokit The authenticated octokit instance
 * @param name The name of the label
 * @param owner The owner of the repository
 * @param repo The name of the repository
 */
export async function DeleteLabel(octokit: Octokit, name: string, owner: string, repo: string) {
	try {
		await octokit.request("DELETE /repos/{owner}/{repo}/labels/{name}", { name, owner, repo });
	} catch (error) {
		octokit.logger.warn(`[DeleteLabel]: Unable to delete label with name ${name} (repository: ${owner}/${repo}) `, error);
	}
}

/**
 * Creates a new label and handles rejections if any
 * @param octokit The authenticated octokit instance
 * @param name The label name
 * @param color The label color
 * @param description The label description
 * @param owner The owner of the repository
 * @param repo The repository name
 */
export async function CreateLabel(octokit: Octokit, name: string, color: string, description: string, owner: string, repo: string) {
	try {
		await octokit.request("POST /repos/{owner}/{repo}/labels", { name, owner, repo, color: color.replace("#", ""), description });
	} catch (error) {
		octokit.logger.warn(`[DeleteLabel]: Unable to create label with name ${name} (repository: ${owner}/${repo}) `, error);
	}
}

/**
 * Updates a label and handles rejections if any
 * @param octokit The authenticated octokit instance
 * @param name The label name
 * @param color The label color
 * @param description The label description
 * @param owner The owner of the repository
 * @param repo The repository name
 */
export async function UpdateLabel(octokit: Octokit, name: string, color: string, description: string, owner: string, repo: string) {
	try {
		await octokit.request("POST /repos/{owner}/{repo}/labels", { name, owner, repo, color: color.replace("#", ""), description });
	} catch (error) {
		octokit.logger.warn(`[DeleteLabel]: Unable to update label with name ${name} (repository: ${owner}/${repo}) `, error);
	}
}
