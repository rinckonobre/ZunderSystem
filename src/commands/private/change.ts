import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, GuildMember, StringSelectMenuBuilder } from "discord.js";
import { config } from "../..";
import { systemRegister } from "../../functions";
import { toHexColor } from "../../functions/aplication/convert";
import { devices, registers } from "../../jsons";
import { Command, DiscordCreate, DocPlayer, Firestore, GuildManager, Interruption } from "../../structs";

const playerColl = new Firestore('players');

export default new Command({
    name: "alterar",
    description: "Comando para administrar diversos dados da Zunder e dos membros",
    visibility: "private",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "registro",
            description: "Altera dados dos membros",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "membro",
                    description: "mencione o membro que deseja alterar o registro",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        },
        {
            name: "moedas",
            description: "Altera dados dos membros",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "membro",
                    description: "Mencione o membro que deseja alterar as moedas",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "ação",
                    description: "Selecione a ação desejada",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: "[ + ] Adicionar", value: "add" },
                        { name: "[ . ] Definir", value: "set" },
                        { name: "[ - ] Remover", value: "remove" },
                    ]
                },
                {
                    name: "valor",
                    description: "Insira o novo valor que deseja",
                    type: ApplicationCommandOptionType.Number,
                    required: true
                },
            ]
        },
        {
            name: "nick",
            description: "Altera dados dos membros",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "membro",
                    description: "Mencione o membro que deseja alterar o registro",
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "nick",
                    description: "Insira o novo nick do membro",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ],
    async run({interaction, options}) {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;
        const guildManager = new GuildManager(interaction.guild!);
        
        const member = interaction.member as GuildMember;
        const memberData = await playerColl.getDocData(member.id) as DocPlayer;
        if (member.id != interaction.guild!.ownerId) {
            new Interruption(interaction, "Apenas Líderes podem usar este comando!");
            return;
        }

        const mention = options.getMember("membro") as GuildMember;
        const mentionData = await playerColl.getDocData(mention.id) as DocPlayer;
        const embed = new EmbedBuilder()
        .setColor(toHexColor(config.colors.default));

        if (!mentionData || !mentionData.registry) {
            embed.setDescription(`Este membro não está registrado!
            Deseja criar um registro para ele automaticamente?`)

            const row = new ActionRowBuilder<ButtonBuilder>({components: [
                DiscordCreate.button("temp-confirm-button", "Confirmar", ButtonStyle.Success),
                DiscordCreate.button("temp-cancel-button", "Cancelar", ButtonStyle.Danger),
            ]})

            const msg = await interaction.reply({ephemeral: true, embeds: [embed], components: [row], fetchReply: true});
            msg.createMessageComponentCollector({componentType: ComponentType.Button})
            .on('collect', (buttonInteraction) => {
                if (buttonInteraction.customId.includes("cancel")) {
                    buttonInteraction.deferUpdate();
                    buttonInteraction.message.delete().catch(err => {})
                    return;
                }

                systemRegister.create(mention);

                embed.setDescription(`O membro: ${mention} foi registrado com o nick: ${mention.displayName}`);

                buttonInteraction.update({
                    embeds: [embed],
                    components: []
                })

                const role = guildManager.findRole(config.guild.roles.registers["member-discord"]);
                if (role) mention.roles.add(role);
            })
            return;
        }

        const mentionDataManager = playerColl.getDocManager(mention.id);
        
        switch (options.getSubcommand()) {
            case "registro":{
                const currRegisters = registers[mentionData.registry.type];
                const currLevel = mentionData.registry.level;
                const register = currRegisters.find(r => r.level == currLevel)!;

                embed.setTitle("Alterar registro")
                .setThumbnail(mention.displayAvatarURL())
                .setColor(register.color as ColorResolvable)
                .setDescription(`> ${mention} **${mention.user.tag}**
                Tipo de registro: ${mentionData.registry.type}
                Nível de registro: ${currLevel} 

                Escolha o que deseja alterar:`);

                const row = new ActionRowBuilder<ButtonBuilder>({components: [
                    DiscordCreate.button("temp-select-level-button", "Nível", ButtonStyle.Primary),
                    DiscordCreate.button("temp-select-type-button", "Tipo", ButtonStyle.Primary),
                    DiscordCreate.button("temp-select-device-button", "Dispositivo", ButtonStyle.Primary)
                ]});

                const msg = await interaction.reply({ephemeral: true, embeds: [embed], components: [row], fetchReply: true});
                msg.createMessageComponentCollector({componentType: ComponentType.Button})
                .on('collect', async (buttonInteraction) => {
                    switch (buttonInteraction.customId) {
                        case "temp-select-level-button":{

                            const row = new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                                new StringSelectMenuBuilder({
                                    customId: "temp-select-level-selectmenu",
                                    placeholder: "Selecione o novo nível",
                                    options: currRegisters.map(r => {
                                        return {
                                            label: r.name,
                                            value: r.level.toString(),
                                            description: `[ ${r.level} ] ${r.name}` 
                                        }
                                    })
                                })
                            ]});

                            const msg = await buttonInteraction.update({components: [row], fetchReply: true});
                            DiscordCreate.selectCollector(msg, (selecInteraction) => {
                                const newLevel = parseInt(selecInteraction.values[0])
                                mentionDataManager.set("registry.level", newLevel)

                                selecInteraction.update({
                                    embeds: [embed.setDescription(`Nível de registro de ${mention} alterado para: ${newLevel}`)],
                                    components: [],
                                });
                            });
                            break;
                        }
                        case "temp-select-type-button":{
                            const row = new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                                new StringSelectMenuBuilder({
                                    customId: "temp-select-type-selectmenu",
                                    placeholder: "Selecione o novo tipo",
                                    options: [
                                        {label: "Zunder", value: "zunder", description: "Tipo Zunder"},
                                        {label: "Discord", value: "discord", description: "Tipo Discord"}
                                    ]
                                })
                            ]});

                            const msg = await buttonInteraction.update({components: [row], fetchReply: true})
                            DiscordCreate.selectCollector(msg, (selecInteraction) => {
                                const newType = selecInteraction.values[0]
                                mentionDataManager.set("registry.type", newType)

                                selecInteraction.update({
                                    embeds: [embed.setDescription(`Tipo de registro de ${mention} alterado para: ${newType}`)],
                                    components: [],
                                });
                            });
                            break;
                        }
                        case"temp-select-device-button":{
                            const row = new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                                new StringSelectMenuBuilder({
                                    customId: "temp-select-device-selectmenu",
                                    placeholder: "Selecione o novo dispositivo",
                                    options: devices.map(d => {
                                        return {
                                            label: d.name, value: d.id, description: d.instructions.staff.slice(0, 60)
                                        }
                                    })
                                })
                            ]});

                            const msg = await buttonInteraction.update({components: [row], fetchReply: true})
                            DiscordCreate.selectCollector(msg, (selecInteraction) => {
                                const newDevice = selecInteraction.values[0]
                                mentionDataManager.set("registry.device", newDevice)

                                selecInteraction.update({
                                    embeds: [embed.setDescription(`Dispositivo de registro de ${mention} alterado para: ${newDevice}`)],
                                    components: [],
                                })
                            })
                            break;
                        }
                    }
                })

                break;
            }
            case "nick":{
                const nick = options.getString("nick")!;
                mentionDataManager.set("registry.nick", nick);

                interaction.reply({ephemeral: true, embeds: [embed.setDescription(`Nick de ${mention} alterado para: ${nick}`)]})
                break;
            }
            case "moedas":{
                
                break;
            }
        }

    },
})