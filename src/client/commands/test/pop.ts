import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonStyle, Embed, EmbedBuilder } from "discord.js";
import { Command } from "../../../app/base";
import { join } from "path";

export default new Command({
    name: "pop",
    description: "Legendary test command of Zunder",
    descriptionLocalizations: {
        "pt-BR": "Comando lendário de testes da Zunder",
    },
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    dmPermission: false,
    async run(interaction) {
        const { guild, member } = interaction;


        const path = join(process.cwd(), "images", "1024-260", "01.png");
        console.log(path);
        const attach = new AttachmentBuilder(path, {name: "image.png"});

        interaction.reply({
            files: [attach]
        });
    },
});