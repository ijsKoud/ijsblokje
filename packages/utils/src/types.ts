export interface GitHubRepoContext {
	/** The owner of the repository */
	owner: string;

	/** The repository name */
	repo: string;
}

export interface Label {
	/** The name of the label */
	name: string;

	/** The label description */
	description: string;

	/** The label color in hex format */
	color: string;
}

export interface OctokitAuthOptions {
	/** The id of the GitHub application */
	appId: number;

	/** The GitHub private key for signing data */
	privateKey: string;

	/** The GitHub client id */
	clientId: string;

	/** The GitHub client secret */
	clientSecret: string;

	/** The installation id */
	installationId?: number;
}
