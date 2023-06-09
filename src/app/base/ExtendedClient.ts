import { ApplicationCommandType, BitFieldResolvable, Client, ClientEvents, Collection, GatewayIntentBits, GatewayIntentsString, Interaction, Partials, version } from "discord.js";
import { ButtonCommandComponents, Command, CommandData, ModalCommandComponents, StringSelectCommandComponents } from "./Command";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { Event } from "./Event";
import { join } from "path";
import "dotenv/config";

import firebase, { ServiceAccount, credential } from "firebase-admin";
import devfbAccount from "../../settings/development/firebase.json";
import prodfbAccount from "../../settings/production/firebase.json";
import { GlobalFonts } from "@napi-rs/canvas";
import server from "../../server";

const startTime: number = Date.now();
const clientDirPath = join(__dirname, "../../client");

const nodeEnv = process.env.ENV ?? "DEV";
const botToken = process.env[`${nodeEnv}_BOT_TOKEN`];
const mainGuildId = process.env[`${nodeEnv}_MAIN_GUILD_ID`];
const enableServer = process.env.ENABLE_SERVER ?? "false";
const serverPort = process.env.PORT;

if (nodeEnv == "DEV"){
    firebase.initializeApp({ credential: credential.cert(devfbAccount as ServiceAccount) });
} else {
    firebase.initializeApp({ credential: credential.cert(prodfbAccount as ServiceAccount) });
}

function fileFilter(fileName: string){
    return fileName.endsWith(".ts") || fileName.endsWith(".js");
}

if (enableServer == "true") server({port: serverPort});

export class ExtendedClient<Ready extends boolean = boolean> extends Client<Ready> {
    public readonly Commands: Collection<string, CommandData> = new Collection();
    public readonly mainGuildId: string;
    public stringSelects: StringSelectCommandComponents = {};
    public modals: ModalCommandComponents = {};
    public buttons: ButtonCommandComponents = {};
    constructor(){
        super({
            intents: [Object.values(GatewayIntentBits) as BitFieldResolvable<GatewayIntentsString, number>],
            partials: Object.values(Partials) as Partials[],
            failIfNotExists: false,
        });
        if (!mainGuildId){
            throw new Error("Main guild id is not defined".red);
        }
        this.mainGuildId = mainGuildId;
    }
    public async start(){
        this.registerFonts(),
        await this.registerEvents(),
        await this.registerCommands(),
        this.login(botToken);
        this.on("ready", this.whenReady);
        this.on("interactionCreate", this.registerListeners);
    }
    private async registerCommands() {
        const comamndsDirPath = join(clientDirPath, "commands");
        if (!existsSync(comamndsDirPath)) mkdirSync(comamndsDirPath);

        for (const subFolder of readdirSync(comamndsDirPath)) {
            if (subFolder.startsWith("-")) continue;
            const subFolderPath = join(comamndsDirPath, subFolder);
            for (const fileName of readdirSync(subFolderPath).filter(fileFilter)){
                const commandPath = join(subFolderPath, fileName);
                const command: Command = (await import(commandPath))?.default;
                if (!command.name){
                    console.log(`! "commands/${subFolder}/${fileName}" file is not exporting a Command`.yellow.italic);
                    continue;
                }
                console.log(`✓ "commands/${subFolder}/${fileName}" `.blue.underline + `registered as ${command.name.cyan}`.green);
                this.Commands.set(command.name, command.data);

                if (command.data.buttons) this.buttons = { ...this.buttons, ...command.data.buttons };
                if (command.data.stringSelects) this.stringSelects = { ...this.stringSelects, ...command.data.stringSelects };
                if (command.data.modals) this.modals = { ...this.modals, ...command.data.modals };
            }
        }
    }
    private registerListeners(interaction: Interaction){
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
        if (!interaction.isCommand()) return;
        const command = this.Commands.get(interaction.commandName);
        if (!command) return;

        const { ChatInput, Message, User } = ApplicationCommandType;

        if (!command.dmPermission && interaction.inCachedGuild()){
            if (interaction.isChatInputCommand() && command.type == ChatInput) command.run(interaction);
            if (interaction.isUserContextMenuCommand() && command.type == User) command.run(interaction);
            if (interaction.isMessageContextMenuCommand() && command.type == Message) command.run(interaction);
            return;
        }
        if (command.dmPermission && !interaction.inCachedGuild()) {
            if (interaction.isChatInputCommand() && command.type == ChatInput) command.run(interaction);
            if (interaction.isUserContextMenuCommand() && command.type == User) command.run(interaction);
            if (interaction.isMessageContextMenuCommand() && command.type == Message) command.run(interaction);
            return;
        }

        if (interaction.isAutocomplete() && command.autoComplete){
            command.autoComplete(interaction);
            return;
        }
    }
    private async registerEvents(){
        const eventsDirPath = join(clientDirPath, "events");
        if (!existsSync(eventsDirPath)) {
          mkdirSync(eventsDirPath);
        }
        for (const subFolder of readdirSync(eventsDirPath)) {
            if (subFolder.startsWith("-")) continue;
            const subFolderPath = join(eventsDirPath, subFolder);
            for (const fileName of readdirSync(subFolderPath).filter(fileFilter)){
                const eventPath = join(subFolderPath, fileName);
                const event: Event<keyof ClientEvents> = (await import(eventPath))?.default;
                if (!event.name){
                    console.log(`! "events/${subFolder}/${fileName}" file is not exporting a Event`.yellow.italic);
                    continue;
                }
                console.log(`✓ "events/${subFolder}/${fileName}" `.yellow.underline + `registered as ${event.name.cyan}`.green);
                if (event.once) this.once(event.name, event.run);
                else this.on(event.name, event.run);
            }
        }
    }
    private registerFonts() {
        const fontsFolder = join(__dirname, "../../../assets/fonts/");

        readdirSync(fontsFolder).forEach((fontName) => {
            readdirSync(`${fontsFolder}/${fontName}/`).filter(f => f.endsWith(".ttf")).forEach((file) => {

                const weight = file.replace(".ttf", "");

                try {
                    const stats = GlobalFonts.registerFromPath(`${fontsFolder}/${fontName}/${file}`, fontName);
                    console.log(stats 
                        ? `${fontName}/${file} `.magenta + "font successfully registered".green
                        : `${fontName}/${file} `.magenta + "is not registered".red
                    );
                } catch (err) {
                    console.log(`Unable to register font ${fontName} ${weight}`.red);
                }
            });
        });
    }
    private whenReady(client: Client<true>){
        const { guilds: { cache: guilds } } = client;
        const loginTime = Date.now() - startTime;
        console.log("\n" + "✓ Bot online".green, `in ${loginTime} ms`.magenta, "in", ` ${nodeEnv} `.bgCyan.black, "mode");
        console.log("discord.js 📦".blue, version.yellow, `Guilds: ${guilds.size}`.cyan);
        
        this.application?.commands.set(this.Commands.map(c => c))
        .then((c) => console.log( "⟨ / ⟩".cyan, `${c.size} commands defined successfully!`.green))
        .catch(err => console.log("error", "✗ An error occurred while trying to set the commands\n".red, err));
    }
}

