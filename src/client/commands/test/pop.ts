import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonStyle, Embed, EmbedBuilder } from "discord.js";
import { Command } from "../../../app/base";

export default new Command({
    name: "pop",
    description: "Legendary test command of Zunder",
    descriptionLocalizations: {
        "pt-BR": "Comando lendário de testes da Zunder",
    },
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    dmPermission: false,
    options: [
        {
            name: "usuario",
            description: "usuario",
            type: ApplicationCommandOptionType.User
        }
    ],
    async run(interaction) {
        const { guild, member } = interaction;

        interaction.reply({
            components: [new ActionRowBuilder<ButtonBuilder>({components: [
                new ButtonBuilder({customId: "test", label: "test", style: ButtonStyle.Success})
            ]})]
        });
    },
});