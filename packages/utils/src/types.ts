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

export type Awaitable<R> = R | Promise<R>;
