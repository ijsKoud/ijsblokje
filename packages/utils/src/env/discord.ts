import { join } from "node:path";

import { Logger } from "@snowcrystals/icicle";
import { bold } from "colorette";
import { config } from "dotenv";
import { z, ZodError } from "zod";

config({ path: join(process.cwd(), ".env"), debug: true });

const logger = new Logger({ parser: { color: true }, name: "ENV PARSER" });
const envSchema = z.object({
	DISCORD_TOKEN: z.string(),
	ALLOWED_DISCORD_USERS: z.string(),
	NODE_ENV: z.literal("production").or(z.literal("development"))
});

try {
	logger.info(`Parsing .env from ${bold(join(process.cwd(), ".env"))}`);
	envSchema.parse(process.env);
} catch (err) {
	if (!(err instanceof ZodError)) {
		console.error(err);
		process.exit(1);
	}

	// Filter out missing ones
	const missing = err.issues.filter((issue) => issue.message === "Required").map((issue) => bold(issue.path[0]));
	logger.fatal(`The following environment variables are missing: ${missing}`);

	const failedTest = err.issues.filter((issue) => issue.message !== "Required");
	for (const failedItem of failedTest) {
		// Environment variable
		const path = failedItem.path[0];
		logger.fatal(`[${path}]: Failed the test with reason: ${failedItem.message}`);
	}

	process.exit(1);
}

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof envSchema> {}
	}
}
