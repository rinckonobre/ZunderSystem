import { GlobalFonts } from "@napi-rs/canvas";
import {
    ApplicationCommandDataResolvable,
    BitFieldResolvable,
    Client,
    ClientEvents,
    Collection,
    CommandInteractionOptionResolver,
    GatewayIntentsString,
    IntentsBitField,
    Partials,
    version
} from "discord.js";
import { CommandType, ComponentsButton, ComponentsSelect, ComponentsModal, EventType, ScheduleType } from ".";
import { readdirSync } from "fs";
import cron from "node-cron";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import firebase, { ServiceAccount, credential } from "firebase-admin";

import devFirestoreAccount from "@/config/development/firebase.json";
import prodFirestoreAccount from "@/config/production/firebase.json";

const enviroment = process.env.ENV as "Development" | "Production";

if (enviroment == "Development"){
    firebase.initializeApp({ credential: credential.cert(devFirestoreAccount as ServiceAccount) });
} else {
    firebase.initializeApp({ credential: credential.cert(prodFirestoreAccount as ServiceAccount) });
}


const clientFolderPath = path.join(__dirname, "../../client/");
const fileCondition = (fileName: string) => fileName.endsWith(".js") || fileName.endsWith(".ts");

export class ExtendedClient extends Client {
    public onwerID: string;
    public mainGuildID: string;
    public commands: Collection<String, CommandType> = new Collection();
    public buttons: ComponentsButton = new Collection();
    public selects: ComponentsSelect = new Collection();
    public modals: ComponentsModal = new Collection();
    public enviroment: "Development" | "Production";
    private slashCommands: Array<ApplicationCommandDataResolvable> = [];

    constructor() {
        super({
            intents: Object.keys(IntentsBitField.Flags) as BitFieldResolvable<GatewayIntentsString, number>,
            partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User, Partials.ThreadMember],
            failIfNotExists: false,
        });
        
        this.enviroment = enviroment;
        this.onwerID = "264620632644255745";
        this.mainGuildID = (enviroment == "Development") ?
        process.env.DEV_MAIN_GUILD_ID as string : 
        process.env.PROD_MAIN_GUILD_ID as string;
    }

    public start() {
        const token = (this.enviroment == "Development") ? 
        process.env.DEV_BOT_TOKEN as string : 
        process.env.PROD_BOT_TOKEN as string;

        this.login(token);
        this.loadCommands();
        this.registerEvents();
        this.registerFonts();
        this.registerSchedules();
        this.registerListeners();

        this.on("ready", () => {
            this.registerCommands();

            const [commands, buttons, selects, modals] = [
                this.commands.size,
                this.buttons.size,
                this.selects.size,
                this.modals.size
            ];
    
            function formatNumber(number: number) {
                return number < 10 ? `0${number}` : `${number}`;
            }
    
            const display = (this.enviroment == "Development") ?
            " in development mode ".bgCyan.black:
            " in production mode ".bgGreen.white;
    
            console.log(" ✓ Bot online".green, display);
            console.log(" discord.js".blue, version.yellow);
            console.log("\u276f ⌨️  Commands (/) loaded:".cyan, `${formatNumber(commands) || "nenhum"}`);
            console.log("\u276f ⏺️  Buttons loaded:".cyan, `${formatNumber(buttons) || "nenhum"}`);
            console.log("\u276f 🗃️  Select Menus loaded:".cyan, `${formatNumber(selects) || "nenhum"}`);
            console.log("\u276f 📑 Modals loaded:".cyan, `${formatNumber(modals) || "nenhum"}`);
        });
    }

    private registerSchedules() {

        const tasksPath = path.join(__dirname, "..", "tasks");
        readdirSync(tasksPath).forEach(local => {

            readdirSync(`${tasksPath}/${local}/`)
                .filter(file => file.endsWith(".ts") || file.endsWith(".js"))
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
    private loadCommands(){
        const commandsFolderPath = path.join(clientFolderPath, "commands");

        const commandsFolders = readdirSync(commandsFolderPath);
        //console.log("\n" + `In commands folder: ${commandsFolders.length}`.blue);
        
        commandsFolders.forEach(subFolder => {
            //console.log("Accessing", subFolder.cyan);
            readdirSync(path.join(commandsFolderPath, subFolder)).filter(fileCondition).forEach(async fileName => {
                //console.log("◌ Loaded".green, fileName.yellow);

                const command: CommandType = (await import(`../../client/commands/${subFolder}/${fileName}`))?.default;
                const { name, buttons, selects, modals } = command;

                this.slashCommands.push(command);
                this.commands.set(name, command);

                if (buttons) buttons.forEach((run, key) => this.buttons.set(key, run));
                if (selects) selects.forEach((run, key) => this.selects.set(key, run));
                if (modals) modals.forEach((run, key) => this.modals.set(key, run));
            });
        });
    }
    private registerCommands() {
        this.application?.commands.set(this.slashCommands)
        .then(() => {
            console.log("✓ Slash Commands (/) defined".green);
        })
        .catch((error) => {
            console.log(`✘ An error occurred while trying to set the Slash Commands (/) \n${error}`.red);
        });
        
        this.on("interactionCreate", (interaction) => {
            if (!interaction.isCommand()) return;

            const { commandName, options } = interaction;

            const command = this.commands.get(commandName);
            if (!command) {
                interaction.reply({ephemeral: true, content: "Este comando não está configurado!"});
                return;
            }

            command.run({client: this, interaction, options: options as CommandInteractionOptionResolver});

        });
    }
    private registerEvents() {
        const eventsFolderPath = path.join(clientFolderPath, "events");

        const eventsFolders = readdirSync(eventsFolderPath);
        //console.log("\n" + `In events folder: ${eventsFolders.length}`.blue);
        eventsFolders.forEach(subFolder => {
            //console.log("Accessing", subFolder.cyan);
            readdirSync(path.join(eventsFolderPath, subFolder)).filter(fileCondition).forEach(async fileName => {
                //console.log("◌ Loaded".green, fileName.yellow);

                const event: EventType<keyof ClientEvents> = (await import(`../../client/events/${subFolder}/${fileName}`))?.default;

                if (event.once){
                    this.once(event.name, event.run);
                } else {
                    this.on(event.name, event.run);
                }
            });
        });
    }
    private registerFonts() {
        const fontsFolder = path.resolve(__dirname, "../../../assets/fonts/");

        readdirSync(fontsFolder).forEach((fontName) => {
            readdirSync(`${fontsFolder}/${fontName}/`).filter(f => f.endsWith(".ttf")).forEach((file) => {

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
    private registerListeners(){
        this.on("interactionCreate", interaction => {
            if (interaction.isModalSubmit()) {
                const { customId } = interaction;
                const clientModal = this.modals.get(customId);
                if (clientModal) clientModal(interaction);
                return;
            }
    
            if (!interaction.isMessageComponent()) return;
            const { customId } = interaction;
        
            if (interaction.isButton()){
                const clientButton = this.buttons.get(customId);
                if (clientButton) clientButton(interaction);
                return;
            }
            if (interaction.isStringSelectMenu()){
                const clientSelect = this.selects.get(customId);
                if (clientSelect) clientSelect(interaction);
                return;
            }
        });
    }
}

