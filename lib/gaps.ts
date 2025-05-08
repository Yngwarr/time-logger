import type { Task } from "./parser";
import type { Result } from "./utils";

const MAX_MINUTES = 8 * 60;

type GapsError = "overtime" | "undertime";

export function fillGaps(tasks: Task[]): Result<Task[], GapsError> {
	let left = MAX_MINUTES;
	const gaps: number[] = [];

	tasks.forEach((task, idx) => {
		const { minutes } = task;

		if (minutes !== undefined) {
			left -= minutes;
		} else {
			gaps.push(idx);
		}
	});

	if (left < 0) {
		return { status: "failure", error: "overtime" };
	}

	const numberOfGaps = gaps.length;

	if (numberOfGaps === 0) {
		if (left > 0) {
			return { status: "failure", error: 'undertime' };
		}
		return { status: "success", result: tasks };
	}

	const part = (left / numberOfGaps) | 0;
	const remainder = left % numberOfGaps;

	gaps.forEach((i, idx) => {
		if (tasks[i] === undefined) {
			return;
		}

		if (idx === 0) {
			tasks[i].minutes = part + remainder;
		} else {
			tasks[i].minutes = part;
		}
	});

	if (tasks.reduce((acc, x) => acc + (x.minutes ?? 0), 0) < MAX_MINUTES) {
		return { status: 'failure', error: 'undertime' }
	}

	return { status: 'success', result: tasks }
}
