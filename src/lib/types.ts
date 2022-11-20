export type Awaitable<R> = R | Promise<R>;

export interface Repository {
	owner: string;
	repo: string;
	archived: boolean;
	private: boolean;
	readmeSync: {
		config: boolean;
	};
}
