import { spawn, spawnSync } from "node:child_process";
import { log, type Result } from "./utils";
import type { Task } from "./parser";
import { formatISO, isValid, parseISO } from "date-fns";

function formatTime(minutes: number) {
	const h = (minutes / 60) | 0;
	const m = minutes % 60;

	return ((h > 0 ? `${h}h ` : "") + (m > 0 ? `${m}m` : "")).trim();
}

type TaskNameError = "no name found";

export function requestTaskName(id: string): Result<string, TaskNameError> {
	const result = spawnSync("jira", ["issue", "view", id]);
	const stdout = result.stdout.toString();
	const name = stdout.match(/# (.+)/);

	if (name === null || name[1] === undefined) {
		console.error(result.stderr.toString());
		return { status: "failure", error: "no name found" };
	}

	return { status: "success", result: name[1].trim() };
}

type WorklogError = "invalid date" | "jira error";

export function writeWorklog(
	tasks: Task[],
	dateOverride?: string,
): Result<null, WorklogError> {
	if (dateOverride && !isValid(parseISO(dateOverride))) {
		return { status: "failure", error: "invalid date" };
	}

	const date =
		dateOverride ?? formatISO(new Date(), { representation: "date" });

	for (const task of tasks) {
		// pleasing the compiler
		if (task.minutes === undefined) {
			continue;
		}

		const time = formatTime(task.minutes);

		const result = spawnSync("jira", [
			"issue",
			"add",
			task.id,
			time,
			"--started",
			`${date} 10:00:00`,
			"--no-input",
		]);

		if (result.status !== 0) {
			console.error(result.stderr.toString());
			return { status: "failure", error: "jira error" }
		} else {
			console.log(`${task.id} ${time} written.`)
		}
	}

	return { status: "success", result: null };
}
