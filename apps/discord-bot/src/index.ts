import "@ijsblokje/utils/env/discord.js";
import { IgloClient } from "@snowcrystals/iglo";
import { GatewayIntentBits } from "discord.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const bot = new IgloClient({
	client: { intents: [GatewayIntentBits.Guilds] },
	paths: { commands: join(__dirname, "commands"), events: join(__dirname, "events") }
});

void bot.run(process.env.DISCORD_TOKEN);
