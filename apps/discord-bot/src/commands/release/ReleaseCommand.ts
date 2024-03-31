import { WebsocketMessageType, type WebsocketVersionEvent } from "@ijsblokje/server";
import { ApplyOptions, Command, type CommandOptions } from "@snowcrystals/iglo";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	type CacheType,
	type CommandInteraction,
	EmbedBuilder
} from "discord.js";

import type ExtendedIgloClient from "../../lib/bot.js";

@ApplyOptions<CommandOptions>({
	name: "release",
	description: "Publish a new release on GitHub",
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

		await interaction.deferReply();
		const version = await this.getProposedVersion(owner, repo);
		if (version === "none") {
			await interaction.editReply({ content: `The repository \`${owner}/${repo}\` does not exist.` });
			return;
		}

		const embed = new EmbedBuilder();
		embed
			.setColor("#a6dfed")
			.setDescription(
				[
					`## We are almost there! 🎉`,
					`Before I release a new version for [\`${owner}/${repo}\`](https://github.com/${owner}/${repo}) I need to know a couple of things:`,
					`- The proposed next version is **${version ?? "unknown"}**, would you like to change this?`,
					`- Is there a message you would like to leave in the release changelog?`
				].join("\n")
			);

		const customIdPrefix = `${owner}-${repo}-${interaction.user.id}-release`;
		const actionSemverRow = new ActionRowBuilder<ButtonBuilder>();
		actionSemverRow.addComponents(
			new ButtonBuilder().setCustomId(`${customIdPrefix}-patch`).setLabel("Patch release").setEmoji("🐛").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`${customIdPrefix}-minor`).setLabel("Minor release").setEmoji("⚒️").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`${customIdPrefix}-major`).setLabel("Major release").setEmoji("⚠️").setStyle(ButtonStyle.Danger)
		);

		const actionEditRow = new ActionRowBuilder<ButtonBuilder>();
		actionEditRow.addComponents(
			new ButtonBuilder().setCustomId(`${customIdPrefix}-edit`).setLabel("Edit release").setEmoji("✏️").setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(`${customIdPrefix}-${version}`)
				.setLabel("Proposed release")
				.setEmoji("✅")
				.setStyle(ButtonStyle.Success)
				.setDisabled(!Boolean(version))
		);

		await interaction.editReply({ embeds: [embed], components: [actionSemverRow, actionEditRow] });
	}

	/**
	 * Attempts to get a proposed version from the ijsblokje GitHub application
	 * @param owner The owner of the repository
	 * @param repo The repository name
	 */
	private getProposedVersion(owner: string, repo: string) {
		return new Promise<string | null | undefined>((res) => {
			const timeout = setTimeout(() => {
				res(null);
				this.client.websocket.off("proposed_check_response", checkFn);
			}, 12e4);

			const checkFn = (data: WebsocketVersionEvent["d"]) => {
				if (!("version" in data)) return;
				if (data.owner !== owner || data.repo !== repo) return;

				res((data as any).version);
				clearTimeout(timeout);
				this.client.websocket.off("proposed_check_response", checkFn);
			};

			this.client.websocket.on("proposed_check_response", (data) => checkFn(data));
			this.client.websocket.send({ t: WebsocketMessageType.PROPOSED_VERSION, d: { owner, repo } });
		});
	}
}
