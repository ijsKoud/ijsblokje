import type { Ijsblokje } from "../ijsblokje";
import { Label } from "./Label";
import { Release } from "./Release";
import { Webhook } from "./Webhook";

const LoadAll = (bot: Ijsblokje) => {
	Webhook(bot);
	Release(bot);
	Label(bot);
};

export default LoadAll;
