export type Awaitable<R> = R | Promise<R>;

export interface Repository {
	owner: string;
	repo: string;
	description: string;
	license: string;
	archived: boolean;
	private: boolean;
	readmeSync: {
		config: boolean;
	};
}

export interface Labels {
	labels: Label[];
	repository: {
		[key: string]: Label[];
	};
}

export interface Label {
	name: string;
	description: string;
	color: string;
}
