import { BreakInteraction, Command, DocumentPlayer, MenuBuilder, config, db } from "@/app";
import { convertHex, findRole, systemRecords } from "@/app/functions";
import { registries } from "@/config/jsons";
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, Collection, EmbedBuilder, GuildMember, ModalBuilder, RoleResolvable, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

// Command statics
const manager = {
    nicks: new Collection() as Collection<string, string>
};

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
        },
        {
            name: "nicks",
            nameLocalizations: {"pt-BR": "nicks"},
            description: "Manage Zunder nick names",
            descriptionLocalizations: {"pt-BR": "Gerenciar nicks da Zunder"},
            type: ApplicationCommandOptionType.Subcommand
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
                interaction.reply({ephemeral: true, content: "Esse comando será reformulado"});
                return;
            }
            case "nicks":{
                await interaction.deferReply({ephemeral: true});

                const members: Set<GuildMember> = new Set();
                const zunderRole = findRole(guild, "Membro Zunder");
                if (!zunderRole){
                    new BreakInteraction(interaction, "O cargo de Membro Zunder não está configurado!");
                    return;
                }
                zunderRole.members.forEach(m => members.add(m));
                
                const staffZunderRole = findRole(guild, "Staff Zunder");
                if (staffZunderRole) staffZunderRole.members.forEach(m => members.add(m));
                
                const zunderMembers: Collection<string, {memberData: DocumentPlayer, member: GuildMember}> = new Collection();
                
                for (const m of members){
                    const memberData = await db.players.get(m.id) as DocumentPlayer | undefined;
                    if (memberData) zunderMembers.set(m.id, {memberData, member: m});
                }

                new MenuBuilder({
                    maxItemsPerPage: 6,
                    type: "Grid_2",
                    mainEmbed: new EmbedBuilder({
                        title: "Nicks da Zunder",
                        color: convertHex(config.colors.zunder),
                        description: "Lista de membros com nick Zunder",
                        footer: {text: "Administração Zunder"}
                    }),
                    items: zunderMembers.map(({member, memberData}) => ({
                        title: member.user.tag,
                        description: `>>> ${member.roles.highest} 
                        ${member}
                        Nick: \`${memberData.registry.nick}\`
                        [NameMc](https://namemc.com/${memberData.registry.nick})`,
                        color: member.displayColor,
                        thumbnail: member.displayAvatarURL({extension: "png"}),
                        selectOption: new StringSelectMenuOptionBuilder({
                            label: member.displayName, value: member.id, emoji: "✏️", 
                            description: `Alterar nick de ${member.user.tag}`,
                        })
                    })),
                    menuFunction: { 
                        placeholder: "Selecione o membro para alterar o nick", 
                        run(interaction) {
                            const id = interaction.values[0];
                            manager.nicks.set(interaction.user.id, id);

                            interaction.showModal(new ModalBuilder({
                                title: "Alterar nick",
                                customId: "manage-nicks-change-modal",
                                components: [new ActionRowBuilder<TextInputBuilder>({components: [
                                    new TextInputBuilder({
                                        customId: "new-nick",
                                        label: "Novo nick",
                                        placeholder: `Digite o novo nick de ${zunderMembers.get(id)?.member.displayName}`,
                                        style: TextInputStyle.Short,
                                        required: true,
                                        minLength: 3
                                    })
                                ]})]
                            }));
                        }
                    }
                })
                .show(interaction, member, true);
                return;
            }
        }
    },
    modals: new Collection([
        ["manage-nicks-change-modal", async (interaction) => {
            if (!interaction.inCachedGuild()) return;
            const { member, guild, fields } = interaction;
            const nick = fields.getTextInputValue("new-nick");

            await interaction.deferReply({ephemeral: true});

            const mention = await guild.members.fetch(manager.nicks.get(member.id) || "notfound").catch(() => null);
            if (!mention){
                new BreakInteraction(interaction, "O membro não foi localizado no servidor!");
                return;
            }
            
            const mentionData = await db.players.get(mention.id) as DocumentPlayer | undefined;
            if (!mentionData){
                new BreakInteraction(interaction, "Os dados de registro do membro não foram encontrados!");
                return;
            }

            await db.players.update(mention.id, "registry.nick", nick);

            if (nick.endsWith("Z_")){
                systemRecords.create({
                    guild, title: "Nick atualizado",
                    color: config.colors.zunder,
                    mention, staff: member,
                    style: "Simple",
                    description: `${mention} **${mention.user.tag}**
                    
                    Nick antigo: \`${mentionData.registry.nick}\`
                    Novo nick: \`${nick}\``,
                });

                interaction.editReply({content: `O nick de ${mention} foi atualizado para \`${nick}\``});
                return;
            }

            await db.players.update(mention.id, "registry.type", "discord");
            
            const oldRegister = registries.zunder.roles[mentionData.registry.level];
            const newRegister = registries.discord.roles[mentionData.registry.level];

            if (mentionData.registry.level < 2){
                const newRole = findRole(guild, newRegister.name);
                if (newRole) await mention.roles.add(newRole);
                
                const oldRole = findRole(guild, oldRegister.name);
                if (oldRole) await mention.roles.remove(oldRole);
            } else {
                const newRole = findRole(guild, newRegister.dependency || "notfound");
                if (newRole) await mention.roles.add(newRole);
                
                const oldRole = findRole(guild, oldRegister.dependency || "notfound");
                if (oldRole) await mention.roles.remove(oldRole);
            }
            
            systemRecords.create({
                guild, title: "Registro encerrado",
                color: config.colors.primary,
                mention, staff: member,
                style: "Simple",
                description: `${mention} **${mention.user.tag}**

                Teve o registro Zunder encerrado
                Novo nick: \`${nick}\``,
            });

            interaction.editReply({content: `O registro Zunder de ${mention} foi encerrado! Novo nick: \`${nick}\``});
        }]
    ])
});

// Command config
type SubCommand = "members" | "nicks"