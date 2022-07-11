import { cleanEnv } from "./utils";

export const REPO_NAME = cleanEnv("REPO_NAME") || "ijsKoud/ijsKoud";
export const USERNAME = cleanEnv("USERNAME") || "ijsKoud";
export const DEPENDENCIES_LABEL_NAME = cleanEnv("LABEL_DEPENDENCIES") || "Dependencies";
export const WEBHOOK_URL = cleanEnv("WEBHOOK_URL") || "http://localhost:3000/";
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
