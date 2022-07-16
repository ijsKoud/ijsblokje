import type { Ijsblokje } from "../ijsblokje";
import { Release } from "./Release";
import { Webhook } from "./Webhook";

const LoadAll = (bot: Ijsblokje) => {
	Webhook(bot);
	Release(bot);
};

export default LoadAll;
