import { ApplicationCommandDataResolvable, ApplicationCommandType, BitFieldResolvable, Client, ClientEvents, Collection, GatewayIntentsString, IntentsBitField, Partials, version } from "discord.js";
import { ButtonComponents, CommandType, EventType, ModalComponents, ScheduleType, StringSelectComponents } from ".";
import { GlobalFonts } from "@napi-rs/canvas";
import { existsSync, readdirSync } from "fs";
import cron from "node-cron";
import dotenv from "dotenv";
import path from "path";
import { log, clear } from "console";
dotenv.config();

import firebase, { ServiceAccount, credential } from "firebase-admin";
import devfbAccount from "../../settings/development/firebase.json";
import prodfbAccount from "../../settings/production/firebase.json";

const enviroment = process.env.ENV as "Development" | "Production";

if (enviroment == "Development"){
    firebase.initializeApp({ credential: credential.cert(devfbAccount as ServiceAccount) });
} else {
    firebase.initializeApp({ credential: credential.cert(prodfbAccount as ServiceAccount) });
}
const clientFolderPath = path.join(__dirname, "../../client/");
const fileCondition = (fileName: string) => fileName.endsWith(".js") || fileName.endsWith(".ts");

export class ExtendedClient extends Client {
    public onwerID: string;
    public mainGuildID: string;
    public commands: Collection<String, CommandType> = new Collection();
    public buttons: ButtonComponents = {};
    public stringSelects: StringSelectComponents = {};
    public modals: ModalComponents = {};
    public enviroment: "Development" | "Production";

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

        this.loadCommands();
        this.registerEvents();
        this.registerFonts();
        this.registerSchedules();
        this.registerListeners();
        this.once("ready", this.whenReady);
        this.login(token);
    }

    private registerSchedules() {
        const tasksFolderPath = path.join(clientFolderPath, "tasks");
        if (!existsSync(tasksFolderPath)) return;
        readdirSync(tasksFolderPath).forEach(local => {

            readdirSync(`${tasksFolderPath}/${local}/`)
            .filter(file => file.endsWith(".ts") || file.endsWith(".js"))
            .forEach(async (filename) => {
                const schedule: ScheduleType = (await import(`../../client/tasks/${local}/${filename}`))?.default;

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
                if (!command.name) return;
                const { name, buttons, stringSelects, modals } = command;

                this.commands.set(name, command);

                if (buttons) this.buttons = {...this.buttons, ...buttons};
                if (stringSelects) this.stringSelects = {...this.stringSelects, ...stringSelects};
                if (modals) this.modals = {...this.modals, ...modals};
            });
        });
    }
    private registerListeners(){
        this.on("interactionCreate", (interaction) => {
            if (interaction.isAutocomplete()){
                const command = this.commands.get(interaction.commandName);
                if (!command || !command.autoComplete) return;
                
                command.autoComplete(interaction);
                return;
            }
            if (interaction.isCommand()){
                const command = this.commands.get(interaction.commandName);
                if (!command) return;
                const { type } = command;
                const { ChatInput, Message, User } = ApplicationCommandType;

                if (interaction.isChatInputCommand() && type == ChatInput) command.run(interaction);
                if (interaction.isUserContextMenuCommand() && type == User) command.run(interaction);
                if (interaction.isMessageContextMenuCommand() && type == Message) command.run(interaction);
                return;
            }
            if (interaction.isButton()){
                const onClick = this.buttons[interaction.customId];
                if (onClick) onClick(interaction);
                return;
            }
            if (interaction.isStringSelectMenu()){
                const onSelect = this.stringSelects[interaction.customId];
                if (onSelect) onSelect(interaction);
                return;
            }
            if (interaction.isModalSubmit()){
                const onSubmit = this.modals[interaction.customId];
                if (onSubmit) onSubmit(interaction);
                return;
            }

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
    private whenReady(){
        clear();
        const display = (this.enviroment == "Development") 
        ? " in development mode ".bgCyan.black
        : " in production mode ".bgGreen.white;
    
        log(" ✓ Bot online".green, display);
        log(" discord.js".blue, version.yellow);
        this.application?.commands.set(this.commands.map(c => c))
        .then((commands) => log("⟨ / ⟩".cyan, `${commands.size} commands defined successfully!`.green))
        .catch((err) => log("An error occurred while trying to set the commands\n".red, err));
    }
    // private registerListeners(){
    //     this.on("interactionCreate", interaction => {
    //         if (interaction.isModalSubmit()) {
    //             const { customId } = interaction;
    //             const clientModal = this.modals.get(customId);
    //             if (clientModal) clientModal(interaction);
    //             return;
    //         }
    
    //         if (!interaction.isMessageComponent()) return;
    //         const { customId } = interaction;
        
    //         if (interaction.isButton()){
    //             const clientButton = this.buttons.get(customId);
    //             if (clientButton) clientButton(interaction);
    //             return;
    //         }
    //         if (interaction.isStringSelectMenu()){
    //             const clientSelect = this.selects.get(customId);
    //             if (clientSelect) clientSelect(interaction);
    //             return;
    //         }
    //     });
    // }
    // private registerCommands() {
    //     this.application?.commands.set(this.slashCommands)
    //     .then(() => {
    //         console.log("✓ Slash Commands (/) defined".green);
    //     })
    //     .catch((error) => {
    //         console.log(`✘ An error occurred while trying to set the Slash Commands (/) \n${error}`.red);
    //     });
    // }
    // this.on("ready", () => {
    //     // this.registerCommands();

    //     // const [commands, buttons, selects, modals] = [
    //     //     this.commands.size,
    //     //     this.buttons.size,
    //     //     this.selects.size,
    //     //     this.modals.size
    //     // ];

    //     // function formatNumber(number: number) {
    //     //     return number < 10 ? `0${number}` : `${number}`;
    //     // }

    //     const display = (this.enviroment == "Development") ?
    //     " in development mode ".bgCyan.black:
    //     " in production mode ".bgGreen.white;

    //     console.log(" ✓ Bot online".green, display);
    //     console.log(" discord.js".blue, version.yellow);
    //     // console.log("\u276f ⌨️  Commands (/) loaded:".cyan, `${formatNumber(commands) || "nenhum"}`);
    //     // console.log("\u276f ⏺️  Buttons loaded:".cyan, `${formatNumber(buttons) || "nenhum"}`);
    //     // console.log("\u276f 🗃️  Select Menus loaded:".cyan, `${formatNumber(selects) || "nenhum"}`);
    //     // console.log("\u276f 📑 Modals loaded:".cyan, `${formatNumber(modals) || "nenhum"}`);
    // });
}

