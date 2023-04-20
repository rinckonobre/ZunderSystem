import { ApplicationCommandOptionType, ApplicationCommandType, ComponentType, TextInputStyle } from 'discord.js';
import { Command } from '../../../app/structs';

export default new Command({
    name: "pop",
    description: "Legendary test command of Zunder",
    descriptionLocalizations: {
        "pt-BR": "Comando lendário de testes da Zunder",
    },
    options: [
        {
            name: "texto",
            description: "digite um texto",
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    async run({ client, interaction, options }) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

    }
});