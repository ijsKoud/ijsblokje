import { join } from "node:path";

import { Logger } from "@snowcrystals/icicle";
import { bold } from "colorette";
import { config } from "dotenv";
import { z, ZodError } from "zod";

import { PRIVATE_KEY_REGEX } from "../regex.js";

config({ path: join(process.cwd(), ".env"), debug: true });

const logger = new Logger({ parser: { color: true }, name: "ENV PARSER" });
const envSchema = z.object({
	APP_ID: z.string(),
	PRIVATE_KEY: z.string().regex(PRIVATE_KEY_REGEX),

	WEBHOOK_SECRET: z.string(),

	GITHUB_CLIENT_ID: z.string(),
	GITHUB_CLIENT_SECRET: z.string(),

	ALLOWED_INSTALLATIONS: z.string(),

	PORT: z.string().max(4),
	SMEE_URL: z.string().url().optional(),
	NODE_ENV: z.literal("production").or(z.literal("development")),

	REDIS_DATABASE_URL: z.string().url()
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
