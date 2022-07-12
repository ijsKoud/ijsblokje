export const cleanEnv = (env: string): string => {
	const key = process.env[env] ?? "";
	return key.replaceAll('"', "").replaceAll("\\n", "\n");
};

export const getPort = () => {
	let port = Number(cleanEnv("PORT"));
	if (isNaN(port)) port = 3000;

	return port;
};
