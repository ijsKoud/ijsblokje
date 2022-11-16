import { config } from "dotenv";
config();

import ijsblokje from "./lib/ijsBlokje.js";
const bot = new ijsblokje();
void bot.start();
