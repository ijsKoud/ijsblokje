import { Websocket } from "@ijsblokje/server";
import { IgloClient } from "@snowcrystals/iglo";

export default class ExtendedIgloClient extends IgloClient {
	public websocket = new Websocket();
}
