module.exports = {
	"**/*.{js,jsx,ts,tsx}": (filenames) => ["yarn turbo lint test", `prettier --write ${filenames.join(" ")}`]
};
