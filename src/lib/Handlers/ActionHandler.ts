import { Collection } from "@discordjs/collection";
import { bold } from "colorette";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type ijsblokje from "../ijsBlokje.js";
import { Action } from "../Structures/Action.js";
import { Context } from "probot";
import type { EmitterWebhookEvent as WebhookEvent } from "@octokit/webhooks";

export default class ActionHandler {
	public globalAccActions = new Collection<string, Action[]>(); // specific repo, any account
	public globalRepoActions = new Collection<string, Action[]>(); // any repo, specific account
	public actions = new Collection<string, Action[]>(); // specific repo, specific account
	public globalActions: Action[] = []; // any repo, any account

	public constructor(public bot: ijsblokje, public directory: string) {}

	public async load() {
		if (!existsSync(this.directory)) throw new Error(`"${this.directory}" does not exist`);

		const data = await readdir(this.directory);
		const accounts = data.filter((str) => !/\.[0-9a-z]+$/i.test(str));
		const repos: string[] = [];

		for (const acc of accounts) {
			const repositories = await readdir(join(this.directory, acc));
			repos.push(...repositories.filter((str) => !/\.[0-9a-z]+$/i.test(str)).map((rep) => `${acc}/${rep}`));
		}

		for (const repo of repos) {
			const files = await readdir(join(this.directory, repo));
			const actions = files.filter((x) => x.endsWith(".js"));

			for (const actionPath of actions) {
				const { default: action } = await import(join(this.directory, repo, actionPath));
				const constructed = new action(this.bot);

				if (!(constructed instanceof Action))
					this.bot.logger.error(`[ActionHandler]: ${repo}/${actionPath} is not a valid ${bold("Action")}.`);

				if (repo === "*/*") this.globalActions.push(constructed);
				else if (repo.startsWith("*/")) this.accActionsSet(repo, constructed);
				else if (repo.endsWith("/*")) this.repoActionsSet(repo, constructed);
				else this.actionsSet(repo, constructed);
			}
		}
	}

	public async onPayloadReceived(payload: WebhookEvent) {
		try {
			// @ts-ignore yes it does exist
			const installationId = payload.payload.installation.id;
			const octokit = await this.bot.octokit.auth({
				type: "installation",
				installationId,
				factory: ({ octokit, octokitOptions, ...otherOptions }: any) => {
					const pinoLog = this.bot.probot.log.child({ name: "github" });
					const options = {
						...octokitOptions,
						log: {
							fatal: pinoLog.fatal.bind(pinoLog),
							error: pinoLog.error.bind(pinoLog),
							warn: pinoLog.warn.bind(pinoLog),
							info: pinoLog.info.bind(pinoLog),
							debug: pinoLog.debug.bind(pinoLog),
							trace: pinoLog.trace.bind(pinoLog)
						},
						throttle: {
							...octokitOptions.throttle,
							id: installationId
						},
						auth: {
							...octokitOptions.auth,
							otherOptions,
							installationId
						}
					};
					const Octokit = octokit.constructor;
					return new Octokit(options);
				}
			});

			const ctx = new Context(payload, octokit as any, this.bot.probot.log);
			const details = ctx.repo();
			if (!this.bot.allowedInstallations.includes(details.owner)) return;

			const globalRepoActions = this.globalRepoActions.get(details.owner) ?? [];
			const globalAccActions = this.globalAccActions.get(details.repo) ?? [];
			const actions = this.actions.get(`${details.owner}/${details.repo}`) ?? [];
			const all = [...globalRepoActions, ...globalAccActions, ...actions, ...this.globalActions].filter((act) =>
				act.options.events.includes(ctx.name)
			);

			all.forEach((act) => void act.run(ctx));
		} catch (error) {}
	}

	private actionsSet(key: string, value: Action) {
		const arr = this.actions.get(key) ?? [];
		arr.push(value);

		this.actions.set(key, arr);
	}

	private accActionsSet(key: string, value: Action) {
		key = key.replace("*/", "");
		const arr = this.globalAccActions.get(key) ?? [];
		arr.push(value);

		this.globalAccActions.set(key, arr);
	}

	private repoActionsSet(key: string, value: Action) {
		key = key.replace("/*", "");
		const arr = this.globalRepoActions.get(key) ?? [];
		arr.push(value);

		this.globalRepoActions.set(key, arr);
	}
}
