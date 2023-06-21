import "@ijsblokje/utils/env.js";
import { Octocat } from "@ijsblokje/octocat";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const bot = new Octocat({
	appId: Number(process.env.APP_ID),
	privateKey: process.env.PRIVATE_KEY,
	clientId: process.env.GITHUB_CLIENT_ID,
	clientSecret: process.env.GITHUB_CLIENT_SECRET,
	redisUrl: process.env.REDIS_DATABASE_URL,
	eventsDirectory: join(__dirname, "events")
});

const urlOrPort = process.env.NODE_ENV === "production" ? Number(process.env.PORT) : process.env.SMEE_URL!;
void bot.start(urlOrPort, process.env.WEBHOOK_SECRET);
