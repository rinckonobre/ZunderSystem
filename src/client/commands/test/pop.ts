import { ApplicationCommandType, ChannelType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { convertHex } from "@/app/functions";
import { Command, config } from "@/app";

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

        interaction.guild.channels.create({
            name: "maranha",
            type: ChannelType.GuildCategory
        });

        interaction.reply({
            ephemeral: true,
            content: "Pop command",
            embeds: [
                new EmbedBuilder({
                    title: "test",
                    color: convertHex(config.colors.default)
                })
            ]
        });
    }
});