module.exports = {
	"**/*.{js,jsx,ts,tsx}": (filenames) => ["pnpm turbo lint test", `prettier --write ${filenames.join(" ")}`]
};
