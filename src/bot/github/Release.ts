import { Changelog } from "../../lib/Release/Changelog";
import type { Ijsblokje } from "../ijsblokje";

export const Release = (bot: Ijsblokje) => {
	const app = bot.probot.probotApp;
	const changelogGenerator = new Changelog(bot);

	app.on("push", async (ctx) => {
		if (ctx.payload.repository.private || !ctx.payload.ref.includes("main")) return;

		const commit = ctx.payload.commits.find((commit) => commit.message.includes("chore(Release): v") && commit.modified.includes("package.json"));
		if (!commit) return;

		const version = changelogGenerator.getVersion(commit.message);
		if (!version) return;

		const repo = ctx.repo();
		const latestCommit = await ctx.octokit.repos.getCommit({ ...repo, ref: "main" });
		const changelog = await changelogGenerator.run(repo.owner, repo.repo, latestCommit.data.sha);

		await ctx.octokit.repos.createRelease({ ...repo, tag_name: `v${version}`, name: version, body: changelog });
	});
};
