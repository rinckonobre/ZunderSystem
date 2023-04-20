import { GlobalFonts } from "@napi-rs/canvas";
import {
    ApplicationCommandDataResolvable,
    BitFieldResolvable,
    Client,
    ClientEvents,
    Collection,
    GatewayIntentsString,
    IntentsBitField,
    Partials
} from "discord.js";
import dotenv from 'dotenv';
import fs from 'fs';
import cron from "node-cron";
import path from 'path';
import { CommandType, ComponentsButton, ComponentsModal, ComponentsSelect, EventType, ScheduleType } from '.';

dotenv.config();

export type BotEnviroment = "development" | "production"
interface ExtendedClientOptions {
    enviroment: BotEnviroment
}

export class ExtendedClient extends Client {
    public onwerID: string;
    public mainGuildID: string;
    public commands: Collection<String, CommandType> = new Collection();
    public buttons: ComponentsButton = new Collection();
    public selects: ComponentsSelect = new Collection();
    public modals: ComponentsModal = new Collection();
    public enviroment: BotEnviroment;
    //public youtube;

    constructor({enviroment}:ExtendedClientOptions) {
        super({
            intents: Object.keys(IntentsBitField.Flags) as BitFieldResolvable<GatewayIntentsString, number>,
            partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User, Partials.ThreadMember],
            failIfNotExists: false,
        });
        this.enviroment = enviroment;
        this.onwerID = "264620632644255745";
        
        this.mainGuildID = (enviroment == "development") ?
        process.env.DEV_MAIN_GUILD_ID as string : 
        process.env.PROD_MAIN_GUILD_ID as string;
    }

    public start() {
        const token = (this.enviroment == "development") ? 
        process.env.DEV_BOT_TOKEN as string : 
        process.env.PROD_BOT_TOKEN as string

        this.registerModules();
        this.registerEvents();
        this.registerFonts();
        this.registerSchedules();
        this.login(token);
    }

    private registerSchedules() {

        const tasksPath = path.join(__dirname, '..', 'tasks');
        fs.readdirSync(tasksPath).forEach(local => {

            fs.readdirSync(`${tasksPath}/${local}/`)
                .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
                .forEach(async (filename) => {
                    const schedule: ScheduleType = (await import(`../tasks/${local}/${filename}`))?.default;

                    const { name, display: consoleDisplay, enable, frequency, execute } = schedule;

                    if (enable) {
                        if (cron.validate(frequency)) {
                            cron.schedule(frequency, execute);
                            console.log("⏱️  " + name.green + " " + consoleDisplay);
                        } else {
                            console.log(`❌ A tarefa ${name} não tem a frequência válida!`.red);
                        }
                    }

                });
        });
    }
    private registerCommands(commands: Array<ApplicationCommandDataResolvable>) {
        this.application?.commands.set(commands)
            .then(() => {
                console.log("✓ Slash Commands (/) defined".green);
            })
            .catch((error) => {
                console.log(`✘ An error occurred while trying to set the Slash Commands (/) \n${error}`.red);
            });
    }
    private async registerModules() {
        // Commands
        const slashCommands: Array<ApplicationCommandDataResolvable> = new Array();
        const commandPath = path.join(__dirname, "../..", "client", "commands");

        const fileCondition = (fileName: string) => fileName.endsWith(".js") || fileName.endsWith(".ts");

        for (const local of fs.readdirSync(commandPath)) {

            for (const fileName of fs.readdirSync(commandPath + `/${local}/`).filter(fileCondition)) {

                const command: CommandType = (await import(`../../client/commands/${local}/${fileName}`))?.default;
                const { name, buttons, selects, modals } = command;

                if (name) {
                    this.commands.set(name, command);
                    slashCommands.push(command);

                    if (buttons) buttons.forEach((run, key) => this.buttons.set(key, run));
                    if (selects) selects.forEach((run, key) => this.selects.set(key, run));
                    if (modals) modals.forEach((run, key) => this.modals.set(key, run));
                }
            }
        }

        this.on("ready", () => this.registerCommands(slashCommands));
    }
    private registerEvents() {
        const eventPath = path.join(__dirname, "../..", "client", "events");
        fs.readdirSync(eventPath).forEach(local => {

            fs.readdirSync(`${eventPath}/${local}/`)
                .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
                .forEach(async (filename) => {
                    const { name, once, run }: EventType<keyof ClientEvents> = (await import(`../../client/events/${local}/${filename}`))?.default;

                    try {
                        if (name && run) (once) ? this.once(name, run) : this.on(name, run);
                    } catch (error) {
                        console.error(`Ocorreu um erro no evento ${name}\n ${error}`.red);
                    }

                });
        });
    }
    private registerFonts() {
        const fontsFolder = path.resolve(__dirname, "../../../assets/fonts/");

        fs.readdirSync(fontsFolder).forEach((fontName) => {
            fs.readdirSync(`${fontsFolder}/${fontName}/`).filter(f => f.endsWith(".ttf")).forEach((file) => {

                const weight = file.replace(".ttf", "");

                try {
                    GlobalFonts.registerFromPath(`${fontsFolder}/${fontName}/${file}`, fontName);
                    //registerFont(`${fontsFolder}/${fontName}/${file}`, { family: fontName, weight })
                } catch (err) {
                    console.log(`Não foi possível registrar a fonte ${fontName} ${weight}`.red);
                }
            });
        });
    }
}