export type Result<Success, Failure> =
	| {
			status: "success";
			result: Success;
	  }
	| {
			status: "failure";
			error: Failure;
	  };

export function log(...args: any[]) {
	console.dir(...args, { depth: null });
}
