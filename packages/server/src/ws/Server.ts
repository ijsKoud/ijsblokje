import { WebSocketServer, type WebSocket } from "ws";
import { Websocket } from "./Websocket.js";
import { Logger } from "@snowcrystals/icicle";
import { type WebsocketEvent, WebsocketMessageType } from "./types.js";
import EventEmitter from "events";

export class WebsocketServer extends EventEmitter {
	public server: WebSocketServer;
	public logger = new Logger({ parser: { color: true }, name: "Websocket Server" });

	public constructor() {
		super();

		this.server = new WebSocketServer({ host: "localhost", port: Websocket.PORT });
		this.server
			.on("listening", () => this.logger.info("Websocket server is listening"))
			.on("error", (err) => this.logger.error(`Received an error: ${err.message} - `, err))
			.on("connection", (websocket) => this.handleSocket(websocket));
	}

	public getVersion = async (owner: string, repo: string): Promise<string | null | undefined> => {
		await new Promise((res) => setTimeout(res, 1e1));
		return null;
	};

	/**
	 * Handles the incoming socket connection
	 * @param websocket The websocket connection to handle
	 */
	private handleSocket(websocket: WebSocket) {
		const send = <T extends WebsocketMessageType>(data: WebsocketEvent<T>) => {
			websocket.send(JSON.stringify(data));
		};

		websocket.onmessage = async (event) => {
			try {
				const data = typeof event.data === "string" ? event.data : "null";
				const { t, d } = JSON.parse(data) as WebsocketEvent<WebsocketMessageType>;
				if (!t || !WebsocketMessageType[t] || !d) return;

				switch (t) {
					case WebsocketMessageType.PING:
						if (d === "request") return send({ t, d: "acknowledged" });
						this.emit("ping_acknowledged");
						break;
					case WebsocketMessageType.PROPOSED_VERSION:
						{
							if ("version" in d) return;
							const version = await this.getVersion(d.owner, d.repo);

							send({ t, d: { ...d, version } });
						}
						break;
					case WebsocketMessageType.RELEASE:
						this.emit("release_version", d);
						break;
					case WebsocketMessageType.UPDATE_README:
						this.emit("sync_readme", d);
						break;
					default:
						break;
				}
			} catch (error) {}
		};
	}
}
