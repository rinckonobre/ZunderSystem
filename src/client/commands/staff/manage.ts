import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, EmbedBuilder, GuildMember, StringSelectMenuBuilder } from "discord.js";
import { BreakInteraction, Command, DocumentPlayer, db } from "../../../app";
import { findEmoji } from "../../../app/functions";
import { registries } from "../../../config/jsons";

export default new Command({
    name: "manage",
    nameLocalizations: {"pt-BR": "gerenciar"},
    description: "Manage areas of server",
    descriptionLocalizations: {"pt-BR": "Gerencia areas do servidor"},
    type: ApplicationCommandType.ChatInput,
    visibility: "staff",
    options: [
        {
            name: "members",
            nameLocalizations: {"pt-BR": "membros"},
            description: "Manage server member",
            descriptionLocalizations: {"pt-BR": "Gerenciar membro do servidor"},
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "member",
                    nameLocalizations: {"pt-BR": "membro"},
                    description: "Mention a member",
                    descriptionLocalizations: {"pt-BR": "Mencion um membro"},
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        }
    ],
    async run({client, interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { member, guild } = interaction;

        const mention = options.getMember("mention") as GuildMember;

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData || memberData.registry.level < 2){
            new BreakInteraction(interaction, "Apenas staffs podem utilizar este comando!");
            return;
        }

        const rows = [
            new ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>(),
            new ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>(),
            new ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>(),
        ];

        switch (options.getSubcommand(true) as SubCommand){
            case "members":{
                const mention = options.getMember("member") as GuildMember;

                const mentionData = await db.players.get(mention.id) as DocumentPlayer | undefined;
                if (!mentionData){
                    new BreakInteraction(interaction, `${mention} não está registrado!`);
                    return;
                }
                
                if (memberData.registry.level < 5 && mentionData.registry.level >= memberData.registry.level){
                    new BreakInteraction(interaction, "Você não tem permissão para gerenciar um membro com o nível maior ou igual ao seu!");
                    return;
                }

                const registry = registries[mentionData.registry.type].roles[mentionData.registry.level];

                const embed = new EmbedBuilder({
                    title: "⚙️ Gerenciar membro",
                    thumbnail: {url: mention.displayAvatarURL()},
                    color: mention.displayColor,
                    description: `> ${findEmoji(client, registry.emojiName)} ${mention.roles.highest} ${mention} 
                    **${mention.user.tag}** \`${mention.id}\`
                    Nível de registro: ${mentionData.registry.level} 
                    Tipo: ${findEmoji(client, mentionData.registry.type)} ${mentionData.registry.type}
                    Dispositivo: ${findEmoji(client, mentionData.registry.device)} ${mentionData.registry.device}
                    Nick: \`${mentionData.registry.nick}\` 
                    `,
                    footer: {text: "Administração Zunder"}
                });

                const manageMemberSelect = new StringSelectMenuBuilder({
                    customId: "manage-member-select",
                    placeholder: "Escolha o que deseja gerenciar",
                    options: [
                        {label: "Editar nick", value: "edit-nick", description: "Editar nick do membro"},
                        {label: "Encerrar registro", value: "close-registry", description: "Encerrar registro Zunder do membro"},
                        {label: "Promover", value: "promote", description: "Promover membro para o cargo acima"},
                        {label: "Rebaixar", value: "demote", description: "Rebaixar membro para o cargo abaixo"},
                        {label: "Silenciamento", value: "mute", description: "Habilitar/Desabilitar microfone do membro"},
                        {label: "Castigo", value: "timeout", description: "Aplicar/Remover castigo do membro"},
                        {label: "Expulsar", value: "kick", description: "Expulsar membro do servidor"},
                        {label: "Banir", value: "ban", description: "Banir membro do servidor"},
                    ]
                });

                rows[0].setComponents(manageMemberSelect);

                await interaction.reply({ephemeral: true, embeds: [embed], components: [rows[0]]});

                return;
            }
        }
        // ...
    }
});

// Command config
type SubCommand = "members"