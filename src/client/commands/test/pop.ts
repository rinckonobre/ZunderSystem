import { ApplicationCommandType, AttachmentBuilder, ChannelType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { convertHex, findChannel } from "@/app/functions";
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
        
        const { member, guild } = interaction;

        const recordsForum = findChannel(guild, "registros-globais", ChannelType.GuildForum);
        if (!recordsForum) return;

        recordsForum.threads.create({
            name: `Registro - ${member.user.tag}`,
            appliedTags: [],
            message: {
                content: `[ ](Novo membro registrado no servidor ${member} ${member.user.tag})`,
                embeds: [
                    new EmbedBuilder({
                        description: `Novo membro registrado no servidor ${member} ${member.user.tag}`,
                        color: convertHex(config.colors.primary),
                        thumbnail: {url: `attachment://avatar-${member.displayName}.png`}
                    })
                ],
                files: [
                    new AttachmentBuilder(member.displayAvatarURL({extension: "png", size: 128}), {name: `avatar-${member.displayName}.png`})
                ]
            }
        });

    }
});