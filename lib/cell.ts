import type { Task } from "./parser";

export function formatCell(tasks: Task[], names: Record<string, string>): string {
	const worklogCell = tasks.map(task => `[${task.id}] ${names[task.id]}`).join('\n');
	return worklogCell;
}
