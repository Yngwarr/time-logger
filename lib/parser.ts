import { log, type Result } from "./utils";

export type Task = {
	id: string;
	minutes?: number;
};

export type ParseError = {
	token: string;
	error: string;
};


export type ParseResult = Result<Task[], ParseError[]>;


export function formatParseError(err: ParseError) {
	return `${err.error} (token: ${err.token})`;
}

function parseTaskId(token: string): string | null {
	const re = /^([A-Z]+-)?\d+$/;
	const match = token.match(re);

	if (match === null) {
		return null;
	}

	if (match[1]) {
		return match[0];
	}

	return `LP-${match[0]}`;
}

function parseTime(token: string): number | null {
	const combo = /^(\d+)h(\d+)m$/;
	const single = /^(\d+)([hm])$/;

	let match = token.match(combo);

	if (match !== null) {
		return parseInt(match[1] ?? "0", 10) * 60 + parseInt(match[2] ?? "0", 10);
	}

	match = token.match(single);

	if (match !== null) {
		return parseInt(match[1] ?? "0", 10) * (match[2] === "h" ? 60 : 1);
	}

	return null;
}

export function parseTasks(tokens: string[]): ParseResult {
	const tasks: Task[] = [];
	const errors: ParseError[] = [];

	for (const t of tokens) {
		const taskId = parseTaskId(t);

		if (taskId !== null) {
			tasks.push({ id: taskId });
			continue;
		}

		const minutes = parseTime(t);

		if (minutes !== null) {
			if (tasks.length === 0) {
				errors.push({ token: t, error: "time as a first argument" });
				continue;
			}

			const lastTask = tasks.at(-1);

			if (lastTask?.minutes !== undefined) {
				errors.push({ token: t, error: "time without a task" });
				continue;
			}

			// must always be true, but compiler doubts it
			if (lastTask !== undefined) {
				lastTask.minutes = minutes;
				continue;
			}
		}

		errors.push({ token: t, error: "couldn't parse" });
	}

	return errors.length > 0
		? { status: "failure", error: errors }
		: { status: "success", result: tasks };
}
