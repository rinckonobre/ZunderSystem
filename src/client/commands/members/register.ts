import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { Command } from "../../../app/base";
import { devices } from "../../../settings/jsons";
import { client, config, db } from "../../..";
import { BreakInteraction } from "../../../app/classes";
import { DocumentPlayer, DocumentPlayerRegistry } from "../../../app/interfaces";
import { buttonCollector, convertHex, findChannel, findEmoji, findRole, systemRecords } from "../../../app/functions";

export default new Command({
    name: "register",
    nameLocalizations: {"pt-BR": "registrar"},
    description: "Create a new zunder register request",
    descriptionLocalizations: {"pt-BR": "Cria uma nova solicitação de registro Zunder"},
    type: ApplicationCommandType.ChatInput,
    dmPermission: false,
    visibility: "public",
    options: [
        {
            name: "nick",
            description: "In game nickname",
            descriptionLocalizations: {"pt-BR": "Nick em jogo"},
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "device",
            description: "Register device",
            descriptionLocalizations: {"pt-BR": "Dispositivo de registro"},
            type: ApplicationCommandOptionType.String,
            choices: [
                {name: "Minecraft", value: "minecraft"}
            ],
            required: true,
        }
    ],
    async run(interaction) {
        const { guild, member, options } = interaction;
        
        if (guild.id !== client.mainGuildId){
            new BreakInteraction(interaction, "Este comando só pode ser utilizado no servidor principal!");
            return;
        }

        const memberData = await db.players.get<DocumentPlayer>(member.id);
        if (!memberData?.registry){
            new BreakInteraction(interaction, "É necessário estar registrado antes no servidor!");
            return;
        }

        if (memberData.registry.type == "zunder"){
            new BreakInteraction(interaction, "Você já é um membro Zunder!");
            return;
        }

        if (memberData.requests && memberData.requests.zunder){
            new BreakInteraction(interaction, "Você já tem uma solicitação de registro Zunder ativa!");
            return;
        }

        const nick = options.getString("nick", true);
        const deviceId = options.getString("device", true);
        const selectedDevice = devices.find(d => d.id == deviceId);
    
        if (!nick.endsWith("Z_")){
            new BreakInteraction(interaction, "O nick que você enviou não é um nick Zunder!");
            return;
        }

        if (!selectedDevice){
            new BreakInteraction(interaction, "Dispositivo selecionado inválido!");
            return;
        }

        const emojis = {
            check: findEmoji(client, "check"),
            cancel: findEmoji(client, "cancel"),
        };

        const message = await interaction.reply({
            ephemeral: true, 
            embeds: [
                new EmbedBuilder({
                    title: "📝 Registro Zunder",
                    color: convertHex(config.colors.theme.zunder),
                    thumbnail: { url: member.displayAvatarURL() },
                    description: `> Você está tentando se registrar usando o nick \`${nick}\`
                    e o dispositivo: ${selectedDevice.name}
                    \n${selectedDevice.instructions.member}`,
                    footer: {
                        text: "Administração Zunder", 
                        iconURL: guild.iconURL() || undefined 
                    }
                })
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>({components: [
                    new ButtonBuilder({
                        customId: "register-confirm-button", 
                        style: ButtonStyle.Success,
                        label: "Confirmar", 
                    }),
                    new ButtonBuilder({
                        customId: "register-cancel-button", 
                        style: ButtonStyle.Danger,
                        label: "Cancelar", 
                    })
                ]})
            ],
            fetchReply: true,
        });

        const collector = buttonCollector(message, {max: 1});
        collector.on("collect", async (subInteraction) => {
            if (subInteraction.customId === "register-cancel-button"){
                new BreakInteraction(subInteraction, "Ação cancelada!");
                return;
            }

            await subInteraction.update({
                embeds: [new EmbedBuilder({
                    ...message.embeds[0].data,
                    description: "Você fez uma solicitação de registro Zunder"
                })],
                components: [],
            });

            const cManagement = findChannel(guild, config.guild.channels.management);
            if (!cManagement) return;

            await db.players.update(member.id, "requests.zunder", { device: selectedDevice.id, nick });

            cManagement.send({
                embeds: [new EmbedBuilder({
                    title: "📝 Solicitação de registro Zunder",
                    color: convertHex(config.colors.theme.zunder),
                    description: `> Member: ${member} **${member.user.tag}**
                    Dispositivo: ${findEmoji(client, selectedDevice.emoji)} **${selectedDevice.name}**
                    ✏️ Nick: \` ${nick} \`
        
                    ${selectedDevice.instructions.staff}`,
                    fields: [
                        {name: "ID do membro", value: member.id, inline: true}
                    ]
                })],
                components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                        new StringSelectMenuBuilder({
                            customId: "register-request-zunder-manage",
                            placeholder: "Aprove ou recuse",
                            options: [
                                { label: "Aprovar", value: "approve", description: "Aprovar registro Zunder", emoji: {id: emojis.check?.id}},
                                { label: "Recusar", value: "recuse", description: "Recusar registro Zunder", emoji: {id: emojis.cancel?.id}}
                            ]
                        })
                    ]})
                ]
            })
            .catch(console.log);
        });
    },
    stringSelects: {
        "register-request-zunder-manage": async interaction => {
            if (!interaction.inCachedGuild()) return;

            const { guild, client, message: { embeds } } = interaction;
            const { data } = embeds[0];
            const mentionId = data.fields?.[0].value || "";

            const selected = interaction.values[0] as "approve" | "recuse";

            const [mention, mentionData] = await Promise.all([
                await guild.members.fetch(mentionId).catch(() => null),
                await db.players.get<DocumentPlayer>(mentionId)
            ]);

            if (!mention){
                new BreakInteraction(interaction, "O membro não foi localizado no servidor!", {deleteTime: 8000, replace: true});
                if (mentionData && mentionData.requests?.zunder) {
                    await db.players.update(mentionId, "requests.zunder", {}, "delete");
                }
                return;
            }
            
            if (!mentionData) {
                new BreakInteraction(interaction, "Os dados do membro não foram localizado!", {deleteTime: 8000, replace: true});
                return;
            }
    
            const requestZunder = mentionData.requests?.zunder;
    
            if (!requestZunder){
                new BreakInteraction(interaction, "O membro não tem uma requisição de registro Zunder ativa!", {deleteTime: 8000, replace: true});
                return;
            }
            
            await db.players.update(mentionId, "requests.zunder", {}, "delete");
            const { nick, device: deviceId } = requestZunder;
            const device = devices.find(d => d.id == deviceId);
            
            if (!device){
                new BreakInteraction(interaction, "Dispositivo escolhido não foi encontrado no sistema!", {deleteTime: 8000, replace: true});
                return;
            }

            if (selected == "recuse"){
                const message = await interaction.update({embeds: [
                    new EmbedBuilder({
                        color: convertHex(config.colors.theme.danger),
                        description: "Esta solicitação de registro foi recusada!"
                    })
                ], components: [], fetchReply: true});

                setTimeout(() => {
                    message.delete()
                    .catch(console.log);
                }, 12 * 1000);

                const embed = new EmbedBuilder({
                    title: "💔 Solicitação recusada",
                    color: convertHex(config.colors.theme.zunder),
                    footer: {
                        text: "Administração Zunder"
                    },
                    timestamp: new Date(),
                    description: `Sua solicitação de registro Zunder foi recusada!
                    Dispositivo: ${findEmoji(client, device.emoji)} **${device.name}**
                    Nick:  \` ${nick} \`
        
                    Motivos para sua solicitação ter sido recusada:
                    ${device.declined}
                    - Seu nick não se encaixa nas [regras para nick Zunder](https://zunderoficial.gitbook.io/zundergroup/a-zunder/zndr-member)
                    `
                });

                mention.send({ embeds: [embed] })
                .catch(console.log);
                return;
            }

            const message = await interaction.update({
                embeds: [ new EmbedBuilder({
                    color: convertHex(config.colors.theme.success),
                    description: "Esta solicitação de registro foi aprovada!",
                    footer: { text: "Administração Zunder" }
                })],
            components: [] });

            setTimeout(() => {
                message.delete()
                .catch(console.log);
            }, 12 * 1000);

            await db.players.update<DocumentPlayerRegistry>(mention.id, "registry", {
                nick, device: deviceId, type: "zunder", level: mentionData.registry.level,
            });

            mention.send({embeds: [new EmbedBuilder({
                title: "💛 Solicitação aprovada",
                color: convertHex(config.colors.theme.zunder),
                description: `Sua solicitação de registro Zunder foi aprovada!
                Dispositivo: ${findEmoji(client, device.emoji)} **${device.name}**
                Nick:  \` ${nick} \`
    
                Sendo membro da Zunder você:
                - Tem acesso a um chat no grupo com recursos exclusivos!
                - Pode participar de eventos e sorteios exclusivos!
                - Tem suporte exclusivo para qualquer problema!
                - Tem funcionalidades a mais no discord da Zunder!
                - Pode participar de clans, guildas e facções da Zunder em qualquer jogo!`,
                timestamp: new Date()
            })]})
            .catch(console.log);

            const roleZunder = findRole(guild, "Membro Zunder");

            if (mentionData.registry.level < 2 && roleZunder){
                await mention.roles.set(mention.roles.cache.filter(r => r.name !== "Membro Discord"));
                await mention.roles.add(roleZunder);
            }

            const roleStaffZunder = findRole(guild, "Staff Zunder");

            if (mentionData.registry.level > 1 && roleStaffZunder){
                await mention.roles.set(mention.roles.cache.filter(r => r.name !== "Staff Discord"));
                await mention.roles.add(roleStaffZunder);
            }

            systemRecords.create({
                guild, title: "📝 Registro",
                color: config.colors.theme.zunder,
                style: "Full",
                description: `> ${mention} **${mention.user.tag}**
                
                Registrado como: ${findEmoji(client, "zunder")} ${findEmoji(client, "register_zunder_member")} ${roleZunder}
                Dispositivo: ${findEmoji(client, device.emoji)} ${device.name}
                ✏️ Nick: \` ${nick} \``
            });
        }
    }
});