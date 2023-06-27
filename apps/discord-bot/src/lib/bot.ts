import { IgloClient } from "@snowcrystals/iglo";
import { Websocket } from "@ijsblokje/server";

export default class ExtendedIgloClient extends IgloClient {
	public websocket = new Websocket();
}
