import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Collection, ColorResolvable, ComponentType, EmbedBuilder, Guild, GuildMember, ModalBuilder, StringSelectMenuBuilder, TextChannel, TextInputStyle } from "discord.js";
import { client, config, db } from "../..";
import { systemRecords, systemRegister } from "../../functions";
import { devices, registers } from "../../jsons";
import { BreakInteraction, Command, DiscordCreate, DocPlayer, EmbedMenu, Firestore, GuildManager, ServerManager } from "../../structs";

const playerColl = new Firestore("players");

export default new Command({
    name: "register",
    nameLocalizations: {"pt-BR": "registrar"},
    description: "Crie uma solicitação de registro Zunder",
    descriptionLocalizations: {"pt-BR": "Create a Zunder register request"},
    type: ApplicationCommandType.ChatInput,
    visibility: "public",
    options: [
        {
            name: "nick",
            description: "Input your in game nickname",
            descriptionLocalizations: {"pt-BR": "Digite o nick em jogo"},
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    async run({client, interaction, options}) {
        if (!interaction.isChatInputCommand()) return;
        const member = interaction.member as GuildMember;
        const guild = interaction.guild as Guild;
        
        if (guild.id != client.mainGuildID) {
            new BreakInteraction(interaction, "Este comando só pode ser usado no servidor principal!");
            return;
        }

        const nick = options.getString("nick", true);

        const memberData = await playerColl.getDocData(member.id) as DocPlayer | undefined;
        if (!memberData) {
            new BreakInteraction(interaction, "Você precisa ter se registrado antes no servidor!");
            return;
        }

        if (memberData?.registry && memberData.registry.type == "zunder") {
            new BreakInteraction(interaction, "Você já está registrado como membro Zunder!");
            return;
        }

        if (memberData?.requests && memberData.requests.zunder) {
            new BreakInteraction(interaction, "Você já fez uma solicitação de registro Zunder!");
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.zunder as ColorResolvable)
            .setDescription("Selecione o dispositivo para registrar");

        new EmbedMenu(interaction, embed, 6, 1)
            .setItems(devices.filter(d => d.id != "discord").map(device => {
                return { title: device.name, content: device.instructions.member, label: device.name, value: device.id };
            }))
            .setExecution("Selecione o dispositivo para registrar", async (selectInteraction) => {
                const deviceID = selectInteraction.values[0];
                const device = devices.find(d => d.id == deviceID)!;

                if (!memberData.requests){
                    memberData.requests = {zunder: { device: deviceID, nick } };
                } else {
                    memberData.requests.zunder = { device: deviceID, nick };
                }

                playerColl.saveDocData(member.id, memberData);

                selectInteraction.update({
                    embeds: [DiscordCreate.simpleEmbed(config.colors.zunder, `Você fez uma solicitação de registro Zunder com o nick: ${nick}`)], 
                    components: []
                });

                member.send({embeds: [DiscordCreate.simpleEmbed(config.colors.zunder, 
                    `Você acabou de fazer uma solicitação de registro Zunder
                Nick: ${nick}
                
                Aguarde a staff verificar e te dar uma resposta`)
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                ]}).catch(() => {});

                const row = new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                    new StringSelectMenuBuilder({
                        customId: "register-request-zunder-manage",
                        placeholder: "Aprove ou recuse",
                        options: [
                            {label: "Aprovar", value: "approve", description: "Aprovar registro Zunder", emoji: {id: ServerManager.findEmoji(guild, "check")?.id}},
                            {label: "Recusar", value: "recuse", description: "Recusar registro Zunder", emoji: {id: ServerManager.findEmoji(guild, "cancel")?.id}}
                        ]
                    })
                ]});

                embed.setTitle("📝 Solicitação de registro Zunder");
                embed.setFields()
                    .setThumbnail(member.displayAvatarURL())
                    .setDescription(`> Member: ${member} **${member.user.tag}**
            Dispositivo: ${ServerManager.findEmoji(guild, device.emoji)} **${device.name}**
            ✏️ Nick: \` ${nick} \`
            
            ${device.instructions.staff}`)
                    .addFields({name: "ID do membro", value: member.id, inline: true});

                const cManagement = ServerManager.findChannel(guild, config.dcGuild.channels.management, ChannelType.GuildText) as TextChannel | undefined;
                if (cManagement) {
                    cManagement.send({content: "||@everyone||", embeds: [embed], components: [row]});
                }
            })
            .display();
    },
    selects: new Collection([
        ["register-request-zunder-manage", async (interaction) => {
            const embed = new EmbedBuilder(interaction.message.embeds[0].data);
            const guild = interaction.guild!;
            const guildManager = new GuildManager(guild);
            const member = interaction.member as GuildMember;
            const mentionID = embed.data.fields![0].value;

            const mention = await guild.members.fetch(mentionID).catch(() => undefined);
            const mentionData = await playerColl.getDocData(mentionID) as DocPlayer | undefined;

            function BreakInteraction(message: string){
                embed.setColor(config.colors.danger as ColorResolvable)
                    .setDescription(message)
                    .setFields();
                interaction.update({embeds: [embed], components: []});
            }

            if (!mention) {
                BreakInteraction("O membro não foi localizado no servidor!");
                if (mentionData && mentionData.requests?.zunder) {
                    delete mentionData.requests.zunder;
                    playerColl.saveDocData(mentionID, mentionData);
                }
                setTimeout(() => {
                    interaction.message.delete().catch(() => {});
                }, 8*1000);
                return;
            }

            if (!mentionData) {
                BreakInteraction("Os dados do membro não foram localizado!");
                return;
            }
            
            const nick = mentionData.requests?.zunder?.nick || "indefinido";
            const deviceId = mentionData.requests?.zunder?.device || "discord";
            if (mentionData.requests?.zunder) {
                delete mentionData.requests.zunder;
            }

            const device = devices.find(d => d.id == deviceId)!;

            if (interaction.values[0] == "approve") {

                mentionData.registry!.nick = nick;
                mentionData.registry!.device = deviceId;
                mentionData.registry!.type = "zunder";


                embed.setTitle("💛 Solicitação aprovada")
                    .setColor(config.colors.zunder as ColorResolvable)
                    .setFooter({text: "Administração Zunder"})
                    .setTimestamp()
                    .setDescription(`Sua solicitação de registro Zunder foi aprovada!
                Dispositivo: ${guildManager.findEmoji(device.emoji)} **${device.name}**
                Nick:  \` ${nick} \`
    
                Sendo membro da Zunder você:
                - Tem acesso a um chat no grupo com recursos exclusivos!
                - Pode participar de eventos e sorteios exclusivos!
                - Tem suporte exclusivo para qualquer problema!
                - Tem funcionalidades a mais no discord da Zunder!
                - Pode participar de clans, guildas e facções da Zunder em qualquer jogo!
                `);
                
                const roleZunder = guildManager.findRole("Membro Zunder");
                const roleDiscord = guildManager.findRole("Membro Discord");

                if ((mentionData.interaction?.level || 1) < 2) {

                    if (roleDiscord) await member.roles.remove(roleDiscord);
                    if (roleZunder) await member.roles.add(roleZunder);
                }
                
                const roleStaffZunder = guildManager.findRole("Staff Zunder");
                const roleStaffDiscord = guildManager.findRole("Staff Discord");
                if ((mentionData.interaction?.level || 1) > 1) {
                    
                    if (roleStaffDiscord) await member.roles.remove(roleStaffDiscord);
                    if (roleStaffZunder) await member.roles.add(roleStaffZunder);
                }

                systemRecords.send(guild, {system: {title: "📝 Sistema de registro", color: config.colors.zunder, style: "FULL" },
                    staff: member, mention, details: `> ${mention.roles.highest} ${mention} **${mention.user.tag}**
                    Registrado como: ${guildManager.findEmoji("register_zunder_member")} ${roleZunder}
                    ✏️ Nick: \` ${nick} \`
                    Tipo de registro ${guildManager.findEmoji("zunder")} Zunder
                    Dispositivo: ${guildManager.findEmoji(device.emoji)} ${device.name}`
                });

                interaction.update({embeds: [DiscordCreate.simpleEmbed(config.colors.success, "Esta solicitação de registro foi aprovada!")], components: []});
            } else {
                embed.setTitle("💔 Solicitação recusada")
                    .setColor(config.colors.danger as ColorResolvable)
                    .setFooter({text: "Administração Zunder"})
                    .setTimestamp()
                    .setDescription(`Sua solicitação de registro Zunder foi recusada!
                Dispositivo: ${guildManager.findEmoji(device.emoji)} **${device.name}**
                Nick:  \` ${nick} \`
    
                Motivos para sua solicitação ter sido recusada:
                ${device.declined}
                - Seu nick não se encaixa nas [regras para nick Zunder](https://zunderoficial.gitbook.io/zundergroup/a-zunder/zndr-member)
                `);

                interaction.update({embeds: [DiscordCreate.simpleEmbed(config.colors.danger, "Esta solicitação de registro foi recusada!")], components: []});
            }

            mention.send({embeds: [embed]}).catch(() => {});
            playerColl.saveDocData(mention.id, mentionData);

            setTimeout(() => {
                interaction.message.delete().catch(() => {});
            }, 8000);

        }]
    ]),
    buttons: new Collection([
        ["register-member-button", async (interaction) => {
            const modal = new ModalBuilder({
                customId: "register-member-modal",
                title: "Registrar",
                components: [
                    DiscordCreate.textInput({type: ComponentType.TextInput,
                        customId: "register-member-nick-input",
                        label: "Nick",
                        placeholder: "Digite seu nick...",
                        style: TextInputStyle.Short,
                        required: true,
                        minLength: 3,
                    })
                ]
            });

            interaction.showModal(modal);
        }]
    ]),
    modals: new Collection([
        ["register-member-modal", async (interaction) => {
            const guild = interaction.guild as Guild;
            const member = interaction.member as GuildMember;
            const nick = interaction.fields.getTextInputValue("register-member-nick-input"); 
            
            const cGeneral = ServerManager.findChannel(guild, config.dcGuild.channels.general, ChannelType.GuildText) as TextChannel | undefined;
        
            //const memberData = await playerColl.getDocData(member.id) as DocPlayer | undefined;
            const memberData = await db.players.get(member.id) as DocPlayer | undefined;
            if (memberData && memberData.registry) {
                client.emit("guildMemberAdd", member);
                new BreakInteraction(interaction, `Você já está registrado! Acesse o chat ${cGeneral}`);
                return;
            }
            
            if (nick.includes(" ")) {
                new BreakInteraction(interaction, "Digite seu nick sem espaços");
                return;
            }

            const blackListChars = [
                "@", "/", "*", "-", "&", "!", "<", ">", "#",
                ":", ";", "(", ")", "$", "%", "`", "[", "]", "+",
                "=",
            ];
        
            for (const char of blackListChars) {
                if (nick.includes(char)) {
                    new BreakInteraction(interaction, `Não utilize caracteres especiais para se registrar!
                    O nick que você enviou contém \`${char}\` `);
                    return;
                }
            }
        
            systemRegister.create(member, nick);
        
            const memberRole = ServerManager.findRole(guild, registers.discord.find(r => r.level == 1)?.name || "Membro Discord");
            if (memberRole && !member.roles.cache.has(memberRole.id)) member.roles.add(memberRole);
        
            systemRecords.send(guild, {
                system: {
                    title: "📝 Registro", color: config.colors.primary, style: "SIMPLE"
                },
                details: `Novo membro registrado: ${member} **${member.user.tag}**
                Nick: \`${nick}\``,
                mention: member,
                staff: client,
            });

            interaction.reply({ephemeral: true, content: `Você foi registrado! Acesse o chat ${cGeneral}`});
            //new ReplyBuilder(interaction, true).setContent(`Você foi registrado! Acesse o chat ${cGeneral}`).send()
            
        }]
    ]),
});