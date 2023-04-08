import { ApplicationCommandType } from 'discord.js';
import { Command } from "../../structs";

export default new Command({
    name: "pop",
    description: "Legendary test command of Zunder",
    descriptionLocalizations: {
        "pt-BR": "Comando lendário de testes da Zunder",
    },
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    async run({ client, interaction, options }) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { guild, member } = interaction;

        interaction.reply({ ephemeral: true, content: "any...", fetchReply: true });

    },
});