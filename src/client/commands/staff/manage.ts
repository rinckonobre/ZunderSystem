import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, GuildMember, StringSelectMenuBuilder } from "discord.js";
import { BreakInteraction, Command, DocumentPlayer, db } from "@/app";

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
                    name: "mention",
                    nameLocalizations: {"pt-BR": "membro"},
                    description: "Mention a member",
                    descriptionLocalizations: {"pt-BR": "Mencion um membro"},
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        }
    ],
    async run({ interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { member, guild } = interaction;

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
                const mention = options.getMember("mention") as GuildMember;
                //systemManager.member(interaction, mention, {member, data: memberData});
                return;
            }
        }
        // ...
    }
});

// Command config
type SubCommand = "members"