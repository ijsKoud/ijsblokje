import { Logger } from "@snowcrystals/icicle";
import { WebSocket, type MessageEvent } from "ws";
import { WebsocketMessageType, type WebsocketEvent } from "./types.js";
import EventEmitter from "events";

export class Websocket extends EventEmitter {
	public logger = new Logger({ name: "Websocket" });
	public websocket!: WebSocket;

	public constructor() {
		super();

		const connect = () => {
			this.websocket = new WebSocket(`ws://localhost:${Websocket.PORT}`);
			this.websocket.onopen = () => this.logger.info("Connected to websocket.");

			this.websocket.onerror = (ev) => {
				if (ev.error.code === "ECONNREFUSED") return;
				this.logger.error(`Received an error: ${ev.message} - `, ev.error);
			};

			this.websocket.onclose = (ev) => {
				this.logger.warn(`Lost websocket connection - code: ${ev.code} | reason: ${ev.reason}`);
				connect();
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
					if (!Object.keys(d).includes("version")) return;
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
