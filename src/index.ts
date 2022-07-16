import { config } from "dotenv";
config();

import { Ijsblokje } from "./bot/ijsblokje";
const bot = new Ijsblokje();
void bot.start();
