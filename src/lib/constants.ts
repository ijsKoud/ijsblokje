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

export const WEBHOOK_EVENTS = [
	"branch_protection_rule",
	"code_scanning_alert",
	"commit_comment",
	"create",
	"delete",
	"discussion",
	"discussion_comment",
	"fork",
	"gollum",
	"issues",
	"issue_comment",
	"member",
	"milestone",
	"project",
	"project_card",
	"public",
	"pull_request",
	"pull_request_review",
	"pull_request_review_comment",
	"pull_request_review_thread",
	"push",
	"release",
	"repository",
	"repository_import",
	"secret_scanning_alert",
	"star",
	"team_add",
	"watch"
];
