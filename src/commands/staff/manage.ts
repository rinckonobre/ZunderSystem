import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, chatInputApplicationCommandMention, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, Guild, GuildMember, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputStyle } from "discord.js";
import { db } from "../..";
import { colors } from "../../config.json";
import { systemRecords } from "../../functions";
import { toHexColor } from "../../functions/aplication/convert";
import { devices, registers } from "../../jsons";
import { BreakInteraction, Command, DiscordCreate, DocPlayer, EmbedMenuBuilder, Firestore, GuildManager, ServerManager } from "../../structs";

const playerColl = new Firestore("players");

export default new Command({
    name: "gerenciar",
    description: "Gerencia diversas áreas da Zunder",
    type: ApplicationCommandType.ChatInput,
    visibility: "staff",
    options: [
        {
            name: "membros",
            description: "Gerencia os membros do servidor",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "membro",
                    description: "Mencione o membro que deseja gerenciar",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                }
            ]
        },
        {
            name: "nicks",
            description: "Gerencia os nicks da Zunder",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "dispositivo",
                    description: "Escolha o dispositivo de registro dos membros",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: devices.filter(d => d.id != "discord").map(d => {
                        return { name: d.name, value: d.id }
                    })
                }
            ]
        }
    ],
    async run({client, interaction, options}) {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;
        const member = interaction.member as GuildMember;
        const guild = interaction.guild!;

        if (guild.id != client.mainGuildID) {
            new BreakInteraction(interaction, "Este comando só pode ser usado no servidor principal!");
            return;
        }

        const memberData = await playerColl.getDocData(member.id) as DocPlayer | undefined;
        if (!memberData || !memberData.registry || memberData.registry.level < 2) {
            new BreakInteraction(interaction, "Apenas staffs podem usar este comando!");
            return;
        }

        const subcommand = options.getSubcommand();

        switch (subcommand) {
            case "membros":{
                await manageMember(interaction, options.getMember("membro") as GuildMember)
                break;
            }
            case "nicks": {

                const deviceID = options.getString("dispositivo", true)
                const docs = (await playerColl.collection.where("registry.device", "==", deviceID).get()).docs

                if (docs.length < 1) {
                    new BreakInteraction(interaction, "Não existem membros registrados com este dispositivo!");
                    return;
                }

                new EmbedMenuBuilder({title: "Nicks da Zunder", maxItems: 6, type: "GRID_3"})
                .editEmbed((e) => e.setColor(colors.zunder as ColorResolvable))
                .setItems(docs.map(doc => {
                    const mentionData = doc.data() as DocPlayer;

                    const mention = guild.members.cache.get(doc.id)
                    if (mention) {
                        return {
                            title: mentionData.registry?.nick || mention.user.tag,
                            content: `> ${mention.roles.highest} ${mention} **${mention.user.tag}**
                            Nível de registro: \` ${mentionData.registry?.level} \`
                            `,
                            thumb: mention.displayAvatarURL(),
                            color: mention.displayHexColor,
                            selectOption: new StringSelectMenuOptionBuilder({
                                label: "Gerenciar " + mentionData.registry?.nick,
                                value: mention.id,
                                emoji: {name: "⚙️"},
                                description: "Alterar nick ou encerrar registro"
                            })
                        }
                    } else {
                        return {
                            title: mentionData.registry?.nick || "Sem nick",
                            content: `> Fora do servidor 
                            ID: \`${doc.id}\`
                            Nível de registro: \` ${mentionData.registry?.level} \``,
                            color: colors.zunder as ColorResolvable,
                            selectOption: new StringSelectMenuOptionBuilder({
                                label: "Gerenciar " + mentionData.registry?.nick,
                                value: doc.id,
                                emoji: {name: "⚙️"},
                                description: "Alterar nick ou encerrar registro"
                            })
                        }
                    }
                }))
                .setMenuFunction("Gerenciar membros", async (subInteraction) => {
                    if (subInteraction.user.id != member.id){ 
                        subInteraction.deferUpdate()
                        return;
                    }

                    const mention = guild.members.cache.get(subInteraction.values[0]);
                    if (!mention) {
                        new BreakInteraction(interaction, "Membro não encontrado!");
                        return;
                    }

                    const format = chatInputApplicationCommandMention;
                    const command = client.application!.commands.cache.find(c => c.name == this.name)!

                    manageMember(subInteraction, mention)
                    // new ReplyBuilder(subInteraction, true)
                    // .addEmbed(DiscordCreate.simpleEmbed(colors.zunder, `Utilize ${format(this.name, "membros", command.id)}`))
                    // .send()

                })
                .send(interaction, member);


                
            }
        }

    },
})

async function manageMember(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction, mention: GuildMember){
    const member = interaction.member as GuildMember;
    const memberData = await db.players.get(member.id) as DocPlayer | undefined;
    const guild = interaction.guild as Guild

    if (!memberData || !memberData.registry || memberData.registry.level < 2){
        new BreakInteraction(interaction, "Apenas staffs podem utilizar este comando!");
        return;
    }
    
    if (mention.user.bot){
        new BreakInteraction(interaction, "Não é possível gerenciar membros bot!");
        return;
    }
    
    if (mention.id === mention.guild.ownerId){
        new BreakInteraction(interaction, "Não é possível gerenciar o proprietário do servidor!");
        return;
    }

    const mentionData = await playerColl.getDocData(mention.id) as DocPlayer | undefined;
    if (!mentionData || !mentionData.registry) {
        new BreakInteraction(interaction, "O membro mencionado não está registrado!");
        return;
    }

    if (memberData.registry.level < 5 && memberData.registry.level <= mentionData.registry.level) {
        new BreakInteraction(interaction, "Você não tem permissão para gerenciar membros com o nível menor ou igual ao seu!")
        return;
    }

    function updateInfos(mention: GuildMember, mentionData: DocPlayer){
        const register = registers[mentionData.registry!.type].find(r => r.level === (mentionData.registry?.level || 1))!;

        const memberRegistry = memberData!.registry!;
        const mentionRegistry = mentionData.registry!;

        const embed = new EmbedBuilder({
            thumbnail: {url: mention.displayAvatarURL()},
            color: toHexColor(register.color),
            description:
            `${ServerManager.findEmoji(guild, register.emoji)} ${mention.roles.highest} ${mention} **${mention.user.tag}**
            ✏️ Nick: \` ${mentionRegistry.nick} \`
            Tipo de registro: ${ServerManager.findEmoji(guild, mentionRegistry.type)} ${mentionRegistry.type}
            Dispositivo: ${ServerManager.findEmoji(guild, mentionRegistry.device)} ${mentionRegistry.device}`,
            footer: {text: mention.id}
        })
        
        const [  manageNick, manageClose, managePromote, manageDemote, manageVoice, manageTimedout, manageKick, manageBan] = [
            true,
            memberRegistry.level > 3 && mentionRegistry.type === "zunder" && mentionRegistry.level < 2,
            memberRegistry.level >= 5 && mentionRegistry.level < 5,
            memberRegistry.level >= 5 && mentionRegistry.level > 1,
            memberRegistry.level >= 2,
            memberRegistry.level >= 3,
            memberRegistry.level >= 3,
            memberRegistry.level >= 4,
        ]

        const rows = [
            new ActionRowBuilder<ButtonBuilder>({components: [
                new ButtonBuilder({customId: "manage-members-nick-button", emoji: "✏️", style: ButtonStyle.Secondary, disabled: !manageNick}),
                new ButtonBuilder({customId: "manage-members-close-button", emoji: "Ⓜ️", style: ButtonStyle.Primary, disabled: !manageClose}),
                new ButtonBuilder({customId: "manage-members-promote-button", label: "Promover", style: ButtonStyle.Success, disabled: !managePromote}),
                new ButtonBuilder({customId: "manage-members-demote-button", label: "Rebaixar", style: ButtonStyle.Danger, disabled: !manageDemote}),
            ]}),
            new ActionRowBuilder<ButtonBuilder>({components: [
                new ButtonBuilder({customId: "manage-members-voice-button", emoji: "🎙️", style: ButtonStyle.Danger, disabled: !manageVoice}),
                new ButtonBuilder({customId: "manage-members-timedout-button", label: "Castigo", style: ButtonStyle.Danger, disabled: !manageTimedout}),
                new ButtonBuilder({customId: "manage-members-kick-button", emoji: "🚪", style: ButtonStyle.Danger, disabled: !manageKick}),
                new ButtonBuilder({customId: "manage-members-ban-button", label: "Banir", style: ButtonStyle.Danger, disabled: !manageBan}),
            ]})
        ]
        return { embed, rows }
    }

    const {embed, rows } = updateInfos(mention, mentionData);
    const msg = await interaction.reply({ephemeral: true, embeds: [embed], components: rows, fetchReply: true});

    DiscordCreate.buttonCollector(msg, async (buttonInteraction) => {

        const modal = new ModalBuilder({
            customId: "inserir",
            title: "inserir",
            components: [
                DiscordCreate.textInput({type: ComponentType.TextInput,
                    customId: "input",
                    label: "display",
                    placeholder: "placeholder",
                    style: TextInputStyle.Short,
                    required: true
                })
            ]
        })

        const cancellButton = new ButtonBuilder({customId: "manage-members-cancel-button", label: "Cancelar", style: ButtonStyle.Danger});
        const rowCancel = new ActionRowBuilder<ButtonBuilder>({components: [
            cancellButton
        ]})
        
        switch (buttonInteraction.customId) {
            case "manage-members-nick-button":{

                modal.setCustomId("manage-members-nick-modal")
                .setTitle("Editar nick do membro")
                .components[0].components[0]
                .setCustomId("manage-members-nick-input")
                .setLabel("Novo nick")
                .setPlaceholder("Digite o novo nick do membro (60 segundos...)")

                buttonInteraction.showModal(modal);
                buttonInteraction.awaitModalSubmit({time: 1000 * 60 })
                .then(async modalInteraction => {
                    const newNick = modalInteraction.fields.getTextInputValue("manage-members-nick-input");
                    const oldNick = mentionData.registry?.nick;
                    modalInteraction.reply({ ephemeral: true, content:
                        `O nick de ${mention} foi alterado de ${oldNick} para ${newNick}` 
                    })

                    mentionData.registry!.nick = newNick;
                    playerColl.saveDocData(mention.id, mentionData);

                    const { embed, rows } = updateInfos(mention, mentionData);
                    interaction.editReply({embeds: [embed], components: rows});

                    // records
                    systemRecords.send(guild, {system: 
                        {color: colors.primary, title: "✏️ Nick alterado", style: "FULL"},
                        staff: member,
                        mention, 
                        details: `> ${mention.roles.highest} ${mention} 
                        - Nick antigo: \`${oldNick}\`
                        - Novo nick: \`${newNick}\``,
                    })
                }).catch(() => {})
                break;
            }
            case "manage-members-close-button":{
                modal.setCustomId("manage-members-close-modal")
                .setTitle("Encerrar registro Zunder")
                .components[0].components[0]
                .setCustomId("manage-members-close-input")
                .setLabel("Novo nick")
                .setPlaceholder("Digite o novo nick do membro (60 segundos...)")

                buttonInteraction.showModal(modal);
                buttonInteraction.awaitModalSubmit({time: 1000 * 60 })
                .then(async modalInteraction => {
                    const newNick = modalInteraction.fields.getTextInputValue("manage-members-close-input");
                    modalInteraction.reply({ ephemeral: true, content:
                        `O registro Zunder de ${mention} foi encerrado! Novo nick ${newNick}` 
                    })

                    mentionData.registry!.nick = newNick;
                    mentionData.registry!.device = "discord";
                    mentionData.registry!.type = "discord";

                    const register = registers.discord.find(r => r.level == 1)!;

                    const newRole = ServerManager.findRole(guild, register.name);
                    const oldRole = ServerManager.findRole(guild, registers.zunder.find(r => r.level == 1)!.name);
                    
                    if (newRole){
                        await mention.roles.add(newRole);
                    }
                    if (oldRole){
                        await mention.roles.remove(oldRole);
                    }

                    playerColl.saveDocData(mention.id, mentionData);

                    const { embed, rows } = updateInfos(mention, mentionData);
                    interaction.editReply({embeds: [embed], components: rows});

                    // records
                    systemRecords.send(guild, {system: 
                        {color: colors.primary, title: "Ⓜ️ Registro Zunder encerrado", style: "FULL"},
                        staff: member, mention,
                        details: `> ${mention.roles.highest} ${mention}
                        Se tornou ${newRole}
                        - Novo nick: \`${newNick}\``,
                    })
                }).catch(() => {});
                break;
            }
            case "manage-members-promote-button":{
                const row = new ActionRowBuilder<ButtonBuilder>({components: [
                    new ButtonBuilder({customId: "manage-members-promote-confirm-button", label: "Confirmar promoção", style: ButtonStyle.Success}),
                    cancellButton
                ]})
                buttonInteraction.update({components: [row]});
                break;
            }
            case "manage-members-promote-confirm-button":{
                const type = mentionData.registry?.type!
                const currLevel = mentionData.registry!.level
                const newLevel = currLevel + 1;

                const currRegister = registers[type].find(r => r.level === currLevel) || registers[type][0];
                const newRegister = registers[type].find(r => r.level === newLevel) || registers[type][0];
                    
                const currRole = ServerManager.findRole(guild, currRegister.name); 
                const newRole = ServerManager.findRole(guild, newRegister.name);
                
                if (currRole) await mention.roles.remove(currRole);
                if (newRole) await mention.roles.add(newRole);
                if (newRegister.dependency) {
                    const dependencyRole = ServerManager.findRole(guild, newRegister.dependency);
                    if (dependencyRole) await mention.roles.add(dependencyRole);
                }

                mentionData.registry!.level = newLevel;
                playerColl.saveDocData(mention.id, mentionData);

                const { embed, rows } = updateInfos(mention, mentionData);
                buttonInteraction.update({embeds: [embed], components: rows});

                interaction.followUp({ephemeral: true, content: `${mention} foi promovido para ${newRole}`});
                systemRecords.send(guild, {system: {title: "Membro promovido", color: colors.success, style: "FULL"}, 
                    staff: member, mention,
                    details: `> ${mention.roles.highest} ${mention}
                    Tipo de registro: ${ServerManager.findEmoji(guild, mentionData.registry!.type)} ${mentionData.registry!.type}
                    Se tornou ${newRole}`,
                })
                break;
            }
            case "manage-members-demote-button":{
                const row = new ActionRowBuilder<ButtonBuilder>({components: [
                    new ButtonBuilder({customId: "manage-members-demote-confirm-button", label: "Confirmar demoção", style: ButtonStyle.Danger}),
                    cancellButton
                ]})
                buttonInteraction.update({components: [row]});
                break;
            }
            case "manage-members-demote-confirm-button":{
                const type = mentionData.registry?.type!
                const currLevel = mentionData.registry!.level
                const newLevel = currLevel - 1;

                const currRegister = registers[type].find(r => r.level === currLevel) || registers[type][0];
                const newRegister = registers[type].find(r => r.level === newLevel) || registers[type][0];
                    
                const currRole = ServerManager.findRole(guild, currRegister.name); 
                const newRole = ServerManager.findRole(guild, newRegister.name);
                
                if (currRole) await mention.roles.remove(currRole);
                if (newRole) await mention.roles.add(newRole);
                if (currRegister.dependency && !newRegister.dependency) {
                    const dependencyRole = ServerManager.findRole(guild, currRegister.dependency);
                    if (dependencyRole) await mention.roles.remove(dependencyRole);
                }

                mentionData.registry!.level = newLevel;
                playerColl.saveDocData(mention.id, mentionData);

                const { embed, rows } = updateInfos(mention, mentionData);
                buttonInteraction.update({embeds: [embed], components: rows});

                interaction.followUp({ephemeral: true, content: `${mention} foi rebaixado para ${newRole}`});
                systemRecords.send(guild, {system: {title: "Membro rebaixado", color: colors.danger, style: "FULL"}, 
                    staff: member, mention,
                    details: `> ${mention.roles.highest} ${mention}
                    Tipo de registro: ${ServerManager.findEmoji(guild, mentionData.registry!.type)} ${mentionData.registry!.type}
                    Se tornou ${newRole}`,
                })
                break;
            }
            case "manage-members-voice-button":{

                if (!mention.voice.channel) {
                    buttonInteraction.reply({ephemeral: true, content: "O membro não está em um canal de voz!"});
                    return;
                }

                let message = "";

                if (mention.voice.serverMute){
                    mention.voice.setMute(false);
                    message = `foi desmutado no servidor`;
                } else {
                    mention.voice.setMute(true);
                    message = `foi mutado no servidor`;
                }
                buttonInteraction.reply({ephemeral: true, content: `${mention} ${message}`});
                systemRecords.send(guild, {
                    system: {title: "Voz no servidor", color: colors.danger, style: "SIMPLE"},
                    staff: member,
                    mention,
                    details: `> ${mention.roles.highest} ${mention}
                    ${message.charAt(0).toUpperCase() + message.slice(1)}`,
                })
                break;
            }
            case "manage-members-timedout-button":{
                const row = (mention.isCommunicationDisabled()) ? 
                new ActionRowBuilder<ButtonBuilder>({components: [
                    new ButtonBuilder({customId: "manage-members-timedout-remove-button", label: "Remover castigo", style: ButtonStyle.Danger}),
                ]})
                :
                new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                    new StringSelectMenuBuilder({
                        customId: "manage-members-timedout-select",
                        placeholder: "Selecione o tempo para o castigo",
                        options: [
                            {label: "5 minutos", value: `${5*60}`, description: "Deixar o membro de castigo por 5 minutos"},
                            {label: "10 minutos", value: `${10*60}`, description: "Deixar o membro de castigo por 10 minutos"},
                            {label: "1 hora", value: `${60*60}`, description: "Deixar o membro de castigo por 1 hora"},
                            {label: "1 dia", value: `${24*60*60}`, description: "Deixar o membro de castigo por 1 dia"},
                        ]
                    })
                ]})
                
                buttonInteraction.update({components: [row, rowCancel]});
                break;
            }
            case "manage-members-timedout-remove-button": {

                mention.timeout(null);

                const { embed, rows } = updateInfos(mention, mentionData)
                buttonInteraction.update({embeds: [embed], components: rows});

                systemRecords.send(guild, {system: { color: colors.danger, title: "Castigo", style: "SIMPLE", },
                staff: member, mention, details: 
                `> ${mention.roles.highest} ${mention}
                Teve o castigo removido`});

                interaction.followUp({ephemeral: true, content: `${mention} teve o castigo removido!`});
                break;
            }
            case "manage-members-kick-button":{
                modal.setCustomId("manage-members-kick-modal")
                .setTitle("Expulsar membro do servidor")
                .components[0].components[0]
                .setCustomId("manage-members-kick-input")
                .setLabel("Razão")
                .setPlaceholder("Digite o motivo para expulsar o membro do servidor");

                buttonInteraction.showModal(modal);
                buttonInteraction.awaitModalSubmit({time: 1000 * 60 })
                .then(async modalInteraction => { if (modalInteraction.customId != "manage-members-kick-modal") return;
                    const reason = modalInteraction.fields.getTextInputValue("manage-members-kick-input");
                    modalInteraction.reply({ ephemeral: true, content:`${mention} foi expulso do servidor!`});
                    
                    const { embed, rows } = updateInfos(mention, mentionData);
                    interaction.editReply({embeds: [embed], components: rows});

                    // records
                    systemRecords.send(guild, {system: {color: colors.danger, title: "Membro expulso", style: "FULL"},
                        staff: member, mention, 
                        details: `> ${mention.roles.highest} **${mention.user.tag}**
                        Este membro foi expulso do servidor
                        Motivo: \`\`\`${reason}\`\`\``
                    })

                    if (mention.id !== guild.ownerId && !mention.user.bot) {
                        mention.kick(reason)
                        .catch(console.error);
                    }

                }).catch(() => {})
                break;
            }
            case "manage-members-ban-button":{
                modal.setCustomId("manage-members-ban-modal")
                .setTitle("Banir membro do servidor")
                .components[0].components[0]
                .setCustomId("manage-members-ban-input")
                .setLabel("Razão")
                .setPlaceholder("Digite o motivo para banir o membro do servidor");

                buttonInteraction.showModal(modal);
                buttonInteraction.awaitModalSubmit({time: 1000 * 60 })
                .then(async modalInteraction => { if (modalInteraction.customId != "manage-members-ban-modal") return;
                    const reason = modalInteraction.fields.getTextInputValue("manage-members-ban-input");
                    modalInteraction.reply({ ephemeral: true, content:`${mention} foi banido do servidor!`});

                    const { embed, rows } = updateInfos(mention, mentionData);
                    interaction.editReply({embeds: [embed], components: rows});

                    // records
                    systemRecords.send(guild, {system: {color: colors.danger, title: "Membro banido", style: "FULL"},
                        staff: member, mention, 
                        details: `> ${mention.roles.highest} ${mention.user.tag}
                        Este membro foi banido do servidor
                        Motivo: \`\`\`${reason}\`\`\``
                    })
                    if (mention.id !== guild.ownerId && !mention.user.bot) {
                        mention.ban({reason: reason, deleteMessageSeconds: 60 * 60 * 24})
                        .catch(console.error);
                    }
                }).catch(() => {})
                break;
            }
            case "manage-members-cancel-button": {
                const { embed, rows } = updateInfos(mention, mentionData);
                buttonInteraction.update({embeds: [embed], components: rows});
                break;
            }
        }
    })

    DiscordCreate.selectCollector(msg, async (selectInteraction) => {
        switch (selectInteraction.customId){
            case "manage-members-timedout-select":{
                const timedout = parseInt(selectInteraction.values[0]) * 1000;

                await mention.timeout(timedout);

                const { embed, rows } = updateInfos(mention, mentionData)
                selectInteraction.update({embeds: [embed], components: rows});

                const time = (mention.communicationDisabledUntilTimestamp || Date.now()) / 1000;
                
                systemRecords.send(guild, {system: { color: colors.danger, title: "Castigo", style: "SIMPLE", },
                staff: member, mention, details: 
                `> ${mention.roles.highest} ${mention}
                Teve um castigo aplicado
                Expiração: <t:${~~(time)}:R>`});
                interaction.followUp({ephemeral: true, content: `${mention} teve um castigo aplicado!`})
                break;
            }
        }
    })
}