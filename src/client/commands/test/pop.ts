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

        interaction.reply({
            components: [new ActionRowBuilder<ButtonBuilder>({components: [
                new ButtonBuilder({customId: "test", label: "test", style: ButtonStyle.Success})
            ]})]
        });
    },
    buttons:{
        test(interaction){
            if (!interaction.inCachedGuild()) return;
            const { member, message, guild } = interaction;
            if (message.embeds.length < 1 || message.embeds[0].fields.length < 1) return;

            const resourceId = message.embeds[0].fields[0].name;
            const authorId = message.embeds[0].fields[1].name;

            console.log(resourceId, authorId);
        }
    }
});