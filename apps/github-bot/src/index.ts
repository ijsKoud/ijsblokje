import { config } from "dotenv";
config();

import { Octocat } from "@ijsblokje/octocat";

const bot = new Octocat({
	appId: Number(process.env.APP_ID),
	privateKey: process.env.PRIVATE_KEY as string,
	clientId: "",
	clientSecret: "",
	redisUrl: ""
});
void bot.start(3000);
