import type { Probot } from "probot";
import { Webhook } from "./Webhook";

const LoadAll = async (app: Probot) => {
	await app.load(Webhook);
};

export default LoadAll;
