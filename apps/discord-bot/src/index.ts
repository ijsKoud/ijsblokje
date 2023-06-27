import "@ijsblokje/utils/env/discord.js";
import { GatewayIntentBits } from "discord.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ExtendedIgloClient from "./lib/bot.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const bot = new ExtendedIgloClient({
	client: { intents: [GatewayIntentBits.Guilds] },
	paths: { commands: join(__dirname, "commands"), events: join(__dirname, "events"), interactions: join(__dirname, "interactions") }
});

void bot.run(process.env.DISCORD_TOKEN);
