import { config } from "dotenv";
import { join } from "node:path";
config({ path: join(process.cwd(), "data", ".env") });

import ijsblokje from "./lib/ijsBlokje.js";
const bot = new ijsblokje();
void bot.start();
