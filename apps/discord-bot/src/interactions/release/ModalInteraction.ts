import { WebsocketMessageType } from "@ijsblokje/server";
import { ApplyOptions, InteractionListener, type InteractionListenerOptions } from "@snowcrystals/iglo";
import type { ModalSubmitInteraction } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ComponentType, InteractionType } from "discord.js";
import { clean } from "semver";

import type ExtendedIgloClient from "../../lib/bot.js";

@ApplyOptions<InteractionListenerOptions>({ name: "-release_edit_response", strategy: "endsWith", type: InteractionType.ModalSubmit })
export default class ButtonReleaseInteraction extends InteractionListener<ExtendedIgloClient> {
	public override async run(interaction: ModalSubmitInteraction) {
		let [owner, repo, userId] = interaction.customId.split("-");
		repo = repo.replace("\\_", "-");
		if (userId !== interaction.user.id) {
			await interaction.deferUpdate();
			return;
		}

		const version = interaction.fields.getTextInputValue("version");
		const message = interaction.fields.getTextInputValue("additional-message");

		const cleanedVersion = clean(version);
		const isSemverBumpType = ["patch", "minor", "major"].includes(version);
		if (!isSemverBumpType && !cleanedVersion) return;

		await interaction.deferReply();

		if (interaction.message && interaction.message.editable) {
			const components = interaction.message.components.map((row) =>
				row.components
					.filter((component) => component.type === ComponentType.Button)
					.map((component) => new ButtonBuilder(component.data as any).setDisabled(true))
			);
			await interaction.message.edit({
				components: components.map((buttons) => new ActionRowBuilder<ButtonBuilder>().setComponents(...buttons))
			});
		}

		this.client.websocket.send({
			t: WebsocketMessageType.RELEASE,
			d: { owner, repo, version: isSemverBumpType ? version : cleanedVersion!, message }
		});
		await interaction.followUp({
			content: `🚀 A [new release](https://github.com/${owner}/${repo}/releases) is on its way to GitHub!`,
			flags: ["SuppressEmbeds"]
		});
	}
}
