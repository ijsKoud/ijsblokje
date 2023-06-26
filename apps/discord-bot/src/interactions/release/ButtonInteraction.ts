import { ApplyOptions, InteractionListener, type InteractionListenerOptions } from "@snowcrystals/iglo";
import { ComponentType, type ButtonInteraction, ButtonBuilder, ActionRowBuilder } from "discord.js";
import type ExtendedIgloClient from "../../lib/bot.js";
import { WebsocketMessageType } from "@ijsblokje/server";

/**
 * Method for checking the interaction Id
 * @param id The id to check
 * @returns
 */
function checkInteractionId(id: string): boolean {
	const [owner, repo, userId, release, type] = id.split("-");
	if (!owner || !repo || !userId || !release || !type) return false;
	return release === "release";
}

@ApplyOptions<InteractionListenerOptions>({ name: "", type: ComponentType.Button, check: checkInteractionId })
export default class ButtonReleaseInteraction extends InteractionListener<ExtendedIgloClient> {
	public override async run(interaction: ButtonInteraction) {
		const [owner, repo, userId, , type] = interaction.customId.split("-");
		if (userId !== interaction.user.id) {
			await interaction.deferUpdate();
			return;
		}

		if (type === "edit") {
			return;
		}

		this.client.websocket.send({ t: WebsocketMessageType.RELEASE, d: { owner, repo, version: type } });

		const components = interaction.message.components.map((row) =>
			row.components
				.filter((component) => component.type === ComponentType.Button)
				.map((component) => new ButtonBuilder(component.data).setDisabled(true))
		);
		await interaction.message.edit({ components: components.map((buttons) => new ActionRowBuilder<ButtonBuilder>().setComponents(...buttons)) });
		await interaction.reply({
			content: `🚀 A [new release](https://github.com/${owner}/${repo}/releases) is on its way to GitHub!`,
			flags: ["SuppressEmbeds"]
		});
	}
}
