import { WebsocketMessageType } from "@ijsblokje/server";
import { ApplyOptions, InteractionListener, type InteractionListenerOptions } from "@snowcrystals/iglo";
import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ComponentType,
	type ModalActionRowComponentBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";

import type ExtendedIgloClient from "../../lib/bot.js";

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
		let [owner, repo, userId, , type] = interaction.customId.split("-");
		repo = repo.replace("\\_", "-");

		if (userId !== interaction.user.id) {
			await interaction.deferUpdate();
			return;
		}

		if (type === "edit") {
			const modal = new ModalBuilder();
			modal.setTitle(`Edit release for ${owner}/${repo}`).setCustomId(`${owner}-${repo}-${userId}-release_edit_response`);

			const versionInput = new TextInputBuilder()
				.setLabel("Version")
				.setCustomId("version")
				.setRequired(true)
				.setPlaceholder("Examples: 1.0.1, major, minor, patch - If an incorrect value is provided the modal will not submit")
				.setStyle(TextInputStyle.Short);

			const additionalMessage = new TextInputBuilder()
				.setLabel("Additional Message")
				.setCustomId("additional-message")
				.setRequired(true)
				.setPlaceholder("This release contains **2** breaking changes...")
				.setStyle(TextInputStyle.Paragraph);

			const actionRowOne = new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(versionInput);
			const actionRowTwo = new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(additionalMessage);
			modal.addComponents(actionRowOne, actionRowTwo);

			await interaction.showModal(modal);
			return;
		}

		const components = interaction.message.components.map((row) =>
			row.components
				.filter((component) => component.type === ComponentType.Button)
				.map((component) => new ButtonBuilder(component.data as any).setDisabled(true))
		);
		await interaction.message.edit({ components: components.map((buttons) => new ActionRowBuilder<ButtonBuilder>().setComponents(...buttons)) });

		this.client.websocket.send({ t: WebsocketMessageType.RELEASE, d: { owner, repo, version: type } });
		await interaction.reply({
			content: `🚀 A [new release](https://github.com/${owner}/${repo}/releases) is on its way to GitHub!`,
			flags: ["SuppressEmbeds"]
		});
	}
}
