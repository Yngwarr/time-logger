import { spawn, spawnSync } from "node:child_process";
import { log, type Result } from "./utils";

type TaskNameError = "no name found";

export function requestTaskName(id: string): Result<string, TaskNameError> {
	const result = spawnSync("jira", ["issue", "view", id]);
	const stdout = result.stdout.toString();
	const name = stdout.match(/# (.+)/);

	if (name === null || name[1] === undefined) {
		return { status: "failure", error: "no name found" };
	}

	return { status: "success", result: name[1].trim() };
}
