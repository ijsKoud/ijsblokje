import { ApplyOptions, EventListener, type EventListenerOptions } from "@snowcrystals/iglo";
import { ActivityType } from "discord.js";

@ApplyOptions<EventListenerOptions>({ name: "ready", once: true })
export default class extends EventListener {
	public override run() {
		const triggerPresence = () =>
			this.client.user?.setPresence({
				activities: [{ type: ActivityType.Watching, name: "GitHub repositories" }]
			});

		triggerPresence();
		setInterval(() => triggerPresence(), 6.048e8); // Keeps the presence from going away
		this.client.logger.info(`${this.client.user!.tag} is up and running! (${this.client.guilds.cache.size} guilds)`);
	}
}
