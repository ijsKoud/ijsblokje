import { cleanEnv } from "./utils";

// GitHub: General
export const USERNAME = "ijsKoud";
export const DEPENDENCIES_LABEL_NAME = "Dependencies";

// Discord: Webhook
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
