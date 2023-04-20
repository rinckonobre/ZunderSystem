import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChannelType, Collection, ComponentType, EmbedBuilder, GuildEmoji, ModalBuilder, StringSelectMenuBuilder, TextInputStyle } from "discord.js";
import { db, client, config } from "../../../app";
import { toHexColor, stringSelectCollector, buttonCollector, logger, wait, systemRecords, systemRegister } from "../../../app/functions";
import { Command, BreakInteraction, DocumentPlayer, DocumentPlayerRegistry, ServerManager, DiscordCreate } from "../../../app/structs";
import { devices, registries } from "../../../config/jsons";


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
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { member, guild, channel } = interaction;
        
        if (guild.id != client.mainGuildID) {
            new BreakInteraction(interaction, "Este comando só pode ser usado no servidor principal!");
            return;
        }

        const nick = options.getString("nick", true);

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData) {
            new BreakInteraction(interaction, "Você precisa ter se registrado antes no servidor!");
            return;
        }

        // if (memberData.registry.type == "zunder") {
        //     new BreakInteraction(interaction, "Você já está registrado como membro Zunder!");
        //     return;
        // }

        // if (memberData?.requests && memberData.requests.zunder) {
        //     new BreakInteraction(interaction, "Você já fez uma solicitação de registro Zunder!");
        //     return;
        // }

        if (!nick.endsWith("Z_")){
            new BreakInteraction(interaction, "É necessário um nick com Z_ no final para se registrar como Zunder!");
            return;
        }

        const emojis: Collection<string, GuildEmoji | undefined> = new Collection(
            devices.map(d => ([d.emoji, client.emojis.cache.find(e => e.name == d.emoji)]))
        )
        emojis.set("check", client.emojis.cache.find(e => e.name == "check"));
        emojis.set("cancel", client.emojis.cache.find(e => e.name == "cancel"));

        const rows = [
            new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>()
        ]

        const buttons = {
            confirm: new ButtonBuilder({customId: "register-confirm-button", label: "Confirmar", style: ButtonStyle.Success}),
            cancel: new ButtonBuilder({customId: "register-cancel-button", label: "Cancelar", style: ButtonStyle.Danger}),
        }

        const deviceSelect = new StringSelectMenuBuilder({
            customId: "register-devices-select",
            placeholder: "Selecione o dispositivo",
            options: devices.filter(d => d.id != "discord").map(d => {
                const { name, emoji, id } = d;
                return {
                    label: name, value: id, 
                    description: `Registrar usando o dispositivo ${d.name}`, 
                    emoji: {id: emojis.get(emoji)?.id}
                }
            })
        });

        rows[0].setComponents(deviceSelect);

        const embed = new EmbedBuilder({
            title: "📝 Registro Zunder",
            color: toHexColor(config.colors.zunder),
            thumbnail: { url: member.displayAvatarURL() },
            description: `> Você está tentando se registrar usando o nick \`${nick}\`
            Selecione um dispositivo para se registrar`,
            footer: {text: "Administração Zunder", iconURL: guild.iconURL() || undefined }
        })

        const message = await interaction.reply({ephemeral: true, embeds: [embed], components: [rows[0]], fetchReply: true});

        stringSelectCollector(message).on("collect", async (subInteraction) => {
            const selected = subInteraction.values[0];
            const selectedDevice = devices.find(d => d.id == selected);

            if (!selectedDevice) {
                new BreakInteraction(subInteraction, "Não foi possível usar o dispositivo selecionado!", {replace: true})
                return;
            }

            const emoji = emojis.get(selectedDevice.emoji)

            embed.setDescription(`O dispositivo selecionado foi ${emoji} **${selectedDevice.name}**
            Deseja confirmar a solicitação de registro?`)

            rows[0].setComponents(buttons.confirm, buttons.cancel);

            subInteraction.update({embeds: [embed], components: [rows[0]]});

            buttonCollector(message).on("collect", async (subInteraction) => {
                const { customId } = subInteraction;
            
                if (customId == "register-cancel-button"){
                    new BreakInteraction(subInteraction, "Você cancelou o envio da solicitação de registro Zunder!", {replace: true});
                    return;
                }

                await db.players.update(member.id, "requests.zunder", {device: selectedDevice.id, nick });

                embed.setFooter(null);
                embed.setDescription(`> Você fez uma solicitação de registro Zunder
                com o nick: \`${nick}\`
                Usando o dispositivo ${emoji} **${selectedDevice.name}**`);

                await subInteraction.update({ embeds: [embed], components: []});

                embed.setDescription(`> Você acabou de fazer uma solicitação de registro Zunder
                Nick: \`${nick}\`
                Dispositivo: ${emoji} **${selectedDevice.name}**
                
                Aguarde a staff verificar e te dar uma resposta`)
    
                await member.send({embeds: [embed]}).catch(logger);
    
                const requestManagerSelect = new StringSelectMenuBuilder({
                    customId: "register-request-zunder-manage",
                    placeholder: "Aprove ou recuse",
                    options: [
                        {label: "Aprovar", value: "approve", description: "Aprovar registro Zunder", emoji: {id: emojis.get("check")?.id}},
                        {label: "Recusar", value: "recuse", description: "Recusar registro Zunder", emoji: {id: emojis.get("cancel")?.id}}
                    ]
                })

                rows[0].setComponents(requestManagerSelect);
    
                embed.setTitle("📝 Solicitação de registro Zunder")
                .setDescription(`> Member: ${member} **${member.user.tag}**
                Dispositivo: ${emojis.get(selectedDevice.emoji)} **${selectedDevice.name}**
                ✏️ Nick: \` ${nick} \`

                ${selectedDevice.instructions.staff}`)
                .setFields({name: "ID do membro", value: member.id, inline: true});
    
                const cManagement = guild.channels.cache.find(c => c.name == config.guild.channels.management);

                if (cManagement?.type == ChannelType.GuildText){
                    cManagement.send({content: "||@everyone||", embeds: [embed], components: [rows[0]]});
                }
           })
        });

    },
    selects: new Collection([
        ["register-request-zunder-manage", async (interaction) => {
            if (!interaction.inCachedGuild()) return;
            const { member, guild, message } = interaction;
            const embed = new EmbedBuilder(message.embeds[0].data);
            const mentionID = embed.data.fields![0].value;

            const mention = await guild.members.fetch(mentionID).catch(() => undefined);
            const mentionData = await db.players.get(mentionID) as DocumentPlayer | undefined;

            async function breakInteraction(text: string){
                embed.setColor(toHexColor(config.colors.danger))
                .setDescription(text)
                .setFields();
                interaction.update({embeds: [embed], components: []});
                await wait(8*1000);
                message.delete().catch(logger);
            }

            const selected = interaction.values[0] as "approve" | "recuse";

            if (!mention) {
                breakInteraction("O membro não foi localizado no servidor!");
                if (mentionData && mentionData.requests?.zunder) {
                    await db.players.update(mentionID, "requests.zunder", "delete");
                    // delete mentionData.requests.zunder;
                    // playerColl.saveDocData(mentionID, mentionData);
                }
                return;
            }

            if (!mentionData) {
                breakInteraction("Os dados do membro não foram localizado!");
                return;
            }

            const requestZunder = mentionData.requests?.zunder;

            if (!requestZunder){
                breakInteraction("O membro não tem uma requisição de registro Zunder ativa!");
                return;
            }
            
            await db.players.update(mentionID, "requests.zunder", {}, "delete");
            
            const nick = requestZunder.nick;
            const deviceId = requestZunder.device;
            
            const device = devices.find(d => d.id == deviceId);
            
            if (!device){
                breakInteraction("Dispositivo escolhido não foi encontrado no sistema!");
                return;
            }

            if (selected == "approve") {

                const newRegistry: DocumentPlayerRegistry = {
                    nick, device: deviceId, type: "zunder", level: mentionData.registry.level,
                }

                await db.players.update(mention.id, "registry", newRegistry);

                embed.setTitle("💛 Solicitação aprovada")
                .setColor(toHexColor(config.colors.zunder))
                .setFooter({text: "Administração Zunder"})
                .setTimestamp()
                .setDescription(`Sua solicitação de registro Zunder foi aprovada!
                Dispositivo: ${ServerManager.findEmoji(guild, device.emoji)} **${device.name}**
                Nick:  \` ${nick} \`
    
                Sendo membro da Zunder você:
                - Tem acesso a um chat no grupo com recursos exclusivos!
                - Pode participar de eventos e sorteios exclusivos!
                - Tem suporte exclusivo para qualquer problema!
                - Tem funcionalidades a mais no discord da Zunder!
                - Pode participar de clans, guildas e facções da Zunder em qualquer jogo!
                `);
                
                const roleZunder = ServerManager.findRole(guild, "Membro Zunder");
                const roleDiscord = ServerManager.findRole(guild, "Membro Discord");

                if (mentionData.registry.level < 2) {
                    if (roleDiscord) await member.roles.remove(roleDiscord);
                    if (roleZunder) await member.roles.add(roleZunder);
                }
                
                const roleStaffZunder = ServerManager.findRole(guild, "Staff Zunder");
                const roleStaffDiscord = ServerManager.findRole(guild, "Staff Discord");
                if ((mentionData.interaction?.level || 1) > 1) {
                    
                    if (roleStaffDiscord) await member.roles.remove(roleStaffDiscord);
                    if (roleStaffZunder) await member.roles.add(roleStaffZunder);
                }

                systemRecords.send(guild, {system: {title: "📝 Sistema de registro", color: config.colors.zunder, style: "FULL" },
                    staff: member, mention, details: `> ${mention.roles.highest} ${mention} **${mention.user.tag}**
                    Registrado como: ${ServerManager.findEmoji(guild, "register_zunder_member")} ${roleZunder}
                    ✏️ Nick: \` ${nick} \`
                    Tipo de registro ${ServerManager.findEmoji(guild, "zunder")} Zunder
                    Dispositivo: ${ServerManager.findEmoji(guild, device.emoji)} ${device.name}`
                }); 

                interaction.update({embeds: [
                    new EmbedBuilder({
                        color: toHexColor(config.colors.success),
                        description: "Esta solicitação de registro foi aprovada!"
                    })
                ], components: []});
            } else {
                embed.setTitle("💔 Solicitação recusada")
                .setColor(toHexColor(config.colors.danger))
                .setFooter({text: "Administração Zunder"})
                .setTimestamp()
                .setDescription(`Sua solicitação de registro Zunder foi recusada!
                Dispositivo: ${ServerManager.findEmoji(guild, device.emoji)} **${device.name}**
                Nick:  \` ${nick} \`
    
                Motivos para sua solicitação ter sido recusada:
                ${device.declined}
                - Seu nick não se encaixa nas [regras para nick Zunder](https://zunderoficial.gitbook.io/zundergroup/a-zunder/zndr-member)
                `);

                interaction.update({embeds: [
                    new EmbedBuilder({
                        color: toHexColor(config.colors.danger),
                        description: "Esta solicitação de registro foi recusada!"
                    })
                ], components: []});
            }

            mention.send({embeds: [embed]}).catch(() => {});
            
            await wait(8000);
            message.delete().catch(() => {});

        }]
    ]),
    buttons: new Collection([
        ["register-member-button", async (interaction) => {
            if (!interaction.inCachedGuild()) return;
            const { member, guild } = interaction;
            const cGeneral = guild.channels.cache.find(c => c.name === config.guild.channels.general);

            const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
            if (memberData) {
                client.emit("guildMemberAdd", member);
                new BreakInteraction(interaction, `Você já está registrado! Acesse o chat ${cGeneral}`);
                return;
            }

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
            if (!interaction.inCachedGuild()) return;
            const { member, guild } = interaction;
            const nick = interaction.fields.getTextInputValue("register-member-nick-input"); 
            const cGeneral = guild.channels.cache.find(c => c.name === config.guild.channels.general);
            
            if (nick.includes(" ")) {
                new BreakInteraction(interaction, "Digite seu nick sem espaços");
                return;
            }

            const blackListChars = [
                "@", "/", "*", "-", "&", "!", "<", ">", "#",
                ":", ";", "(", ")", "$", "%", "`", "[", "]", "+",
                "=", ".", ",", "{", "}"
            ];
        
            for (const char of blackListChars) {
                if (nick.includes(char)) {
                    new BreakInteraction(interaction, `Não utilize caracteres especiais para se registrar!
                    O nick que você enviou contém \`${char}\` `);
                    return;
                }
            }
            
            const memberRole = ServerManager.findRole(guild, registries.discord.roles[1].name);
            if (!memberRole) {
                new BreakInteraction(interaction, "O cargo de membro padrão não foi encontrado");
                return;
            }
    
            systemRegister.create(member, nick);
            member.roles.add(memberRole);
        
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
        }]
    ]),
})