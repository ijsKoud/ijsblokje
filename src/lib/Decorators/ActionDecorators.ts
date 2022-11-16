import type ijsblokje from "../ijsBlokje.js";
import type { Action } from "../Structures/Action.js";
import { ApplyOptionsParam, createClassDecorator, createProxy, ConstructorType } from "./utils.js";

/**
 * Applies the ConstructorOptions to an Action extended class
 * @param result The ConstructorOptions or a function to get the ConstructorOptions from
 */
export function ApplyActionOptions<Options extends Action.Options>(result: ApplyOptionsParam<Options>): ClassDecorator {
	const getOptions = (client: ijsblokje) => (typeof result === "function" ? result(client) : result);

	return createClassDecorator((target: ConstructorType<ConstructorParameters<typeof Action>, Action>) =>
		createProxy(target, {
			construct: (constructor, [client, baseOptions = {}]: [ijsblokje, Partial<Options>]) =>
				new constructor(client, { ...baseOptions, ...getOptions(client) })
		})
	);
}
