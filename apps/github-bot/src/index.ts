import "@ijsblokje/utils/env.js";
import { Octocat } from "@ijsblokje/octocat";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const eventsDirectory = join(__dirname, "events");
const allowedInstallations = process.env.ALLOWED_INSTALLATIONS.split(",");
const urlOrPort = process.env.NODE_ENV === "production" ? Number(process.env.PORT) : process.env.SMEE_URL!;

const bot = new Octocat({
	appId: Number(process.env.APP_ID),
	privateKey: process.env.PRIVATE_KEY,
	clientId: process.env.GITHUB_CLIENT_ID,
	clientSecret: process.env.GITHUB_CLIENT_SECRET,
	redisUrl: process.env.REDIS_DATABASE_URL,
	allowedInstallations,
	eventsDirectory
});

bot.logger.info(`Starting Octocat in ${process.env.NODE_ENV} mode`);
void bot.start(urlOrPort, process.env.WEBHOOK_SECRET);