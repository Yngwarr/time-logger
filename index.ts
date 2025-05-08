import { exit } from "node:process";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { formatParseError, parseTasks, type Task } from "./lib/parser";
import { log, type Result } from "./lib/utils";
import { fillGaps } from "./lib/gaps";
import { requestTaskName } from "./lib/jira";

// google sheets example
// "[LP-642] Add rate limiting to member enrollments
// [LP-622] Enhance Create Profile screen UY"	8

// jira cli command
// $ jira issue worklog add LP-622 8h --started '2025-05-05 10:00:00' --no-input

// usage examples

// for today
// $ log-time 622 3h30m 623 4h30m
// $ log-time 622 3h30m 623

// short form
// $ log-time 622

// several tasks will split work load
// $ log-time 622 623

// any other day
// $ log-time 622 8h --date 2025-05-05

// not to log anything to jira
// $ log-time 622 623 --dry

// const optionDefinitions = [
//   { name: 'verbose', alias: 'v', type: Boolean },
//   { name: 'src', type: String, multiple: true, defaultOption: true },
//   { name: 'timeout', alias: 't', type: Number }
// ]

function main() {
	const optionDefs = [
		{
			name: "task",
			type: String,
			multiple: true,
			defaultOption: true,
			typeLabel: "task",
			description: "task entries; see examples below",
		},
		{
			name: "write",
			type: Boolean,
			alias: "w",
			description: "write work logs to jira",
		},
		{
			name: "sloppy",
			type: Boolean,
			description: "don't care if the sum is not equal to 8h",
		},
		{
			name: "help",
			type: Boolean,
			alias: "h",
			description: "show usage info (you're here now)",
		},
	];

	const opts = commandLineArgs(optionDefs);
	const usageInfo = commandLineUsage([
		{
			header: "Time logger",
			content:
				"Log time in Jira, paste stuff to Google Sheets, get on with your day.",
		},
		{
			header: "Options",
			optionList: optionDefs,
		},
	]);

	log(opts);

	if (opts.help || opts.task === undefined || opts.task.length === 0) {
		console.log(usageInfo);
		exit();
	}

	const parseResult = parseTasks(opts.task);

	if (parseResult.status === "failure") {
		console.error("Things went wrong:");

		for (const err of parseResult.error) {
			console.error(`- ${formatParseError(err)}`);
		}

		exit(1);
	}

	const gapsResult = fillGaps(parseResult.result);

	if (gapsResult.status === "failure") {
		console.error(
			`Couldn't fill in the gaps. Reason: ${gapsResult.error.type}, ${gapsResult.error.left} minutes left.`,
		);
		exit(1);
	}

	const tasks = gapsResult.result;

	const taskNames: Record<string, string> = {};
	for (const task of tasks) {
		const nameResult = requestTaskName(task.id);

		if (nameResult.status === "failure") {
			console.error(
				`Couldn't retrieve the task ${task.id} from Jira. Reason: ${nameResult.error}`,
			);
			exit(1);
		}

		taskNames[task.id] = nameResult.result;
	}

	log(taskNames)
}

main();
