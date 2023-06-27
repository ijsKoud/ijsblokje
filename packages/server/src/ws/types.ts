export enum WebsocketMessageType {
	/** The ping event to check if the other connection is still alive */
	PING = 1,

	/** The release event to request a new release */
	RELEASE = 2,

	/** Event for a proposed version */
	PROPOSED_VERSION = 3,

	/** Event for updating the readme */
	UPDATE_README = 4
}

export type WebsocketEvent<T extends WebsocketMessageType> = { t: T; d: unknown } & WebsocketEvents;
export type WebsocketEvents = WebsocketPingEvent | WebsocketReleaseEvent | WebsocketVersionEvent | WebsocketReadmeEvent;

export interface WebsocketPingEvent {
	t: WebsocketMessageType.PING;
	d: "acknowledged" | "request";
}

export interface WebsocketReleaseEvent {
	t: WebsocketMessageType.RELEASE;
	d: {
		owner: string;
		repo: string;
		version: string;
		message?: string;
	};
}

export interface WebsocketVersionEvent {
	t: WebsocketMessageType.PROPOSED_VERSION;
	d:
		| {
				owner: string;
				repo: string;
		  }
		| {
				owner: string;
				repo: string;
				version: string | null;
		  };
}

export interface WebsocketReadmeEvent {
	t: WebsocketMessageType.UPDATE_README;
	d: {
		owner: string;
		repo: string;
	};
}
