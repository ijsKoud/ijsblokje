export const cleanEnv = (env: string): string => {
	const key = process.env[env] ?? "";
	return key.replaceAll('"', "").replaceAll("\\n", "\n");
};
