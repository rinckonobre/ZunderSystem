import { Command } from "@/app";
import { findRole } from "@/app/functions";
import { ApplicationCommandType } from "discord.js";

export default new Command({
    name: "pop",
    description: "Legendary test command of Zunder",
    descriptionLocalizations: {
        "pt-BR": "Comando lendário de testes da Zunder",
    },
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    async run({ interaction }) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        
        const { member, guild } = interaction;

        const info = {
            id: String
        };

        console.log(info.id);

    }
});