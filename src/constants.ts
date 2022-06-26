import { cleanEnv } from "./utils";

export const REPO_NAME = cleanEnv("REPO_NAME") || "ijsKoud/ijsKoud";
export const USERNAME = cleanEnv("USERNAME") || "ijsKoud";
export const DEPENDENCIES_LABEL_NAME = cleanEnv("LABEL_DEPENDENCIES") || "Dependencies";
