import { WebsocketMessageType } from "@ijsblokje/server";
import { ApplyOptions, Command, type CommandOptions } from "@snowcrystals/iglo";
import { ApplicationCommandOptionType, type CacheType, type CommandInteraction } from "discord.js";

import type ExtendedIgloClient from "../../lib/bot.js";

@ApplyOptions<CommandOptions>({
	name: "readme-sync",
	description: "Forcefully sync readme's",
	permissions: { dm: false },
	options: [
		{ name: "owner", description: "The name of the GitHub account", type: ApplicationCommandOptionType.String, required: true },
		{ name: "repository", description: "The repository name", type: ApplicationCommandOptionType.String, required: true }
	]
})
export default class extends Command<ExtendedIgloClient> {
	public override async run(interaction: CommandInteraction<CacheType>) {
		if (!process.env.ALLOWED_DISCORD_USERS.includes(interaction.user.id)) {
			await interaction.reply({ content: "You are not allowed to use this command." });
			return;
		}

		const owner = interaction.options.get("owner", true).value! as string;
		const repo = interaction.options.get("repository", true).value! as string;
		this.client.websocket.send({ t: WebsocketMessageType.UPDATE_README, d: { owner, repo } });

		await interaction.reply({
			content: `🔄️ Synchronization request for [\`${owner}/${repo}\`](https://github.com/${owner}/${repo}) sent!`,
			flags: ["SuppressEmbeds"]
		});
	}
}
