import { Logger } from "@snowcrystals/icicle";
import EventEmitter from "events";
import { type MessageEvent, WebSocket } from "ws";

import { type WebsocketEvent, WebsocketMessageType } from "./types.js";

export class Websocket extends EventEmitter {
	public logger = new Logger({ parser: { color: true }, name: "Websocket" });
	public websocket!: WebSocket;

	public constructor() {
		super();

		const connect = () => {
			this.websocket = new WebSocket(`ws://${process.env.WEBSOCKET_ADDRESS || "localhost"}:${Websocket.PORT}`);
			this.websocket.onopen = () => this.logger.info("Connected to websocket.");

			this.websocket.onerror = (ev) => {
				if (ev.error.code === "ECONNREFUSED") return;
				this.logger.error(`Received an error: ${ev.message} - `, ev.error);
			};

			this.websocket.onclose = (ev) => {
				this.logger.warn(`Lost websocket connection - code: ${ev.code} | reason: ${ev.reason}`);
				setTimeout(() => connect(), 5e3);
			};

			this.websocket.onmessage = this.onMessage.bind(this);
		};
		connect();
	}

	/**
	 * Sends a message to the websocket server
	 * @param data The message data
	 */
	public send<T extends WebsocketMessageType>(data: WebsocketEvent<T>) {
		this.websocket.send(JSON.stringify(data));
	}

	/**
	 * Handles incoming messages
	 * @param event The event object
	 */
	private onMessage(event: MessageEvent) {
		try {
			const data = typeof event.data === "string" ? event.data : "null";
			const { t, d } = JSON.parse(data) as WebsocketEvent<WebsocketMessageType>;
			if (!t || !WebsocketMessageType[t] || !d) return;

			switch (t) {
				case WebsocketMessageType.PING:
					if (d === "acknowledged") return;
					this.send({ t: WebsocketMessageType.PING, d: "acknowledged" });
					break;
				case WebsocketMessageType.PROPOSED_VERSION:
					if (!("version" in d)) return;
					this.emit("proposed_check_response", d);
					break;
				default:
					break;
			}
		} catch (error) {}
	}

	/** The port the websocket is running on */
	public static PORT = 9300;
}
