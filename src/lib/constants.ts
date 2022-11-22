export const REPO_UPDATE_EVENTS = ["deleted", "transferred"];
export const LABEL_ISSUES_EVENTS = ["edited", "opened"];

export const README_CONFIG_LOCATION = ".github/.readmeconfig.json";
export const BASE_README = "config/readme_ijskoud.md";
export const LABELS_CONFIG = "config/labels.json";

export const GH_OWNER = "ijsKoud";

export const COMMIT_TYPES = [
	"chore",
	"build",
	"ci",
	"docs",
	"feat",
	"fix",
	"perf",
	"refactor",
	"revert",
	"style",
	"test",
	"types",
	"workflow",
	"wip"
];
export const COMMIT_REGEX =
	/^(?<type>build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test|¯\\_\(ツ\)_\/¯)(?<scope>\(\w+\)?((?=:\s)|(?=!:\s)))?(?<breaking>!)?(?<subject>:\s.*)?|^(?<merge>Merge \w+)/gm;
