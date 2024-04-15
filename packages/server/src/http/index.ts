import { Webhooks } from "@octokit/webhooks";
import parser from "body-parser";
import EventSource from "eventsource";
import express, { type Express, type Request, type Response } from "express";

export class Server extends Webhooks {
	/** The source where all the messages are coming from */
	public readonly source: Express | EventSource;

	public constructor(options: ServerOptions) {
		super({ secret: options.secret });

		if (typeof options.urlOrPort === "string") {
			this.source = new EventSource(options.urlOrPort);
			this.source.onmessage = this.onEventSourceMessage.bind(this);
		} else {
			this.source = express();
			this.source.get("/ping", (req, res) => res.send("PONG"));
			this.source.post("/events", parser.json({ limit: "0.5mb", type: ["application/json"] }), this.onEventPost.bind(this));
			this.source.listen(options.urlOrPort);
		}
	}

	private async onEventPost(req: Request, res: Response) {
		const getSingleHeader = (header: string | string[] | undefined) => (Array.isArray(header) ? header[0] : header ?? "");
		await this.verifyAndReceive({
			id: getSingleHeader(req.headers["x-request-id"]),
			name: getSingleHeader(req.headers["x-github-event"]) as any,
			signature: getSingleHeader(req.headers["x-hub-signature-256"]),
			payload: JSON.stringify(req.body)
		}).catch(console.error);

		res.sendStatus(204);
	}

	private async onEventSourceMessage(event: MessageEvent<any>) {
		try {
			const data = JSON.parse(event.data);
			await this.verifyAndReceive({
				id: data["x-request-id"],
				name: data["x-github-event"] as any,
				signature: data["x-hub-signature-256"],
				payload: JSON.stringify(data.body)
			});
		} catch (error) {
			console.log(error);
		}
	}
}

export interface ServerOptions {
	urlOrPort: string | number;
	secret: string;
}
