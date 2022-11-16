import { ApplyActionOptions } from "../../../lib/Decorators/ActionDecorators.js";
import { Action } from "../../../lib/Structures/Action.js";

@ApplyActionOptions({ event: "push" })
export default class GlobalAction extends Action {
	public run(ctx: Action.Context<"push">) {
		console.log(ctx.name, ctx.payload);
	}
}
