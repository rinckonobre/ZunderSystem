import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { Command } from "../../../app/base";

export default new Command({
    name: "pop",
    description: "Legendary test command of Zunder",
    descriptionLocalizations: {
        "pt-BR": "Comando lendário de testes da Zunder",
    },
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    options: [
        {
            name: "usuario",
            description: "usuario",
            type: ApplicationCommandOptionType.User
        }
    ],
    async run(interaction) {
        //if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { guild, member } = interaction;
        
    }
});