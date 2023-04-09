import { ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChannelType, Collection, ColorResolvable, EmbedBuilder, GuildMember, italic, StringSelectMenuBuilder, TextChannel, time } from "discord.js";
import { config } from "../..";
import { systemExperience } from "../../functions";
import { systemWork } from "../../functions/systems/system-work";
import { works } from "../../jsons";
import { Command, Cooldown, DiscordCreate, DocumentPlayer, EmbedMenu, Firestore, Interruption, ReplyBuilder, ServerManager, TextUtils } from "../../structs";

const playersColl = new Firestore("players");

export default new Command({
    name: "work",
    nameLocalizations: {"pt-BR": "trabalho"},
    description: "💼 Works of Zunder",
    descriptionLocalizations: {"pt-BR": "💼 Trabalhos da Zunder"},
    type: ApplicationCommandType.ChatInput,
    visibility: "public",
    options: [
        {
            name: "profissão",
            description: "Selecione uma profissão",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "carreira",
            description: "Veja sua carreira de trabalho",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "membro",
                    description: "Veja a carreira de outro membro",
                    type: ApplicationCommandOptionType.User
                },
            ]
        }
    ],
    async run({client, interaction, options}) {
        if (!interaction.isChatInputCommand()) return;
        const member = interaction.member as GuildMember;
        const guild = interaction.guild!
        
        if (guild.id != client.mainGuildID) {
            new Interruption(interaction, "Este comando só pode ser usado no servidor principal!");
            return;
        }

        const cWork = ServerManager.findChannel(guild, config.guild.channels.work, ChannelType.GuildText) as TextChannel | undefined;
        const cLogs = ServerManager.findChannel(guild, config.guild.channels.logs, ChannelType.GuildText) as TextChannel | undefined;
            
        const emojiWorkXp = ServerManager.findEmoji(guild, "workXp");

        const roleWork = ServerManager.findRole(guild, config.guild.roles.functional.work);

        const memberData = await playersColl.getDocData(member.id) as DocumentPlayer | undefined;
        if (!memberData || !memberData.registry) {
            new Interruption(interaction, "Apenas membros registrados podem utilizar este comando!")
            return;
        }

        let selectedSector: string;
        let selectedProfession: string;
        switch (options.getSubcommand()) {
            case "profissão": {

                const currCooldown = memberData.cooldowns?.commands?.work?.profession || Date.now()
                if (Date.now() < currCooldown) {
                    new Interruption(interaction, `Você poderá usar esse comando novamente <t:${~~(currCooldown / 1000)}:R>`)
                    return;
                }

                const embed = new EmbedBuilder().setColor(config.colors.systems.work as ColorResolvable)
                .setTitle("💼 Trabalho")
                .setDescription(`Selecione um setor para escolher a profissão`);
        
                new ReplyBuilder(interaction, true).addEmbed(embed)
                .addSelect(0, new StringSelectMenuBuilder({
                    customId: "work-sector-select",
                    placeholder: "Selecione o setor",
                    options: works.map((sector) => {
                        const emoji = ServerManager.findEmoji(guild, sector.emoji)
                        return {
                            label: sector.game,
                            description: `Trabalhe no setor de ${sector.game}`,
                            value: sector.id,
                            emoji: (emoji) ? {id: emoji.id} : undefined
                        }
                    })
                }))
                .setSelectFunction(async (selectInteraction) => {
                    if (selectInteraction.customId == "work-sector-select"){

                        const sector = works.find(sector => sector.id == selectInteraction.values[0])!
                        selectedSector = sector.id;
                        
                        embed
                        .setThumbnail(sector.image)
                        .setFields()
                        .setDescription(`> Selecione uma profissão do setor de **${sector.game}**.
                        Ao vencer uma partida no jogo escolhido, tire uma print
                        e envie no chat ${cWork}, então aguarde a verificação.
                        
                        ${italic(`Lembre-se que depois de escolher uma profissão,
                        deverá esperar 7 dias para trocar novamente!`)} 
                        
                        `)

                        sector.professions.forEach(async (profession) => {
                            embed.addFields(
                                {
                                    name: profession.emoji + " " + profession.name, 
                                    value: `> Modo: \`${profession.mode}\`
                                    > Servidores aceitos: \`${profession.servers.join(`\`, \``)}\``, inline: true
                                },
                                {
                                    name: "Ganhos: ", 
                                    value: `${emojiWorkXp} Xp de trabalho: \`${profession.exp}\`
                                    💳 Pontuação salarial: \`${profession.salary}\``, inline: true
                                },
                                {
                                    name: "\u200b", 
                                    value: "\u200b", inline: true
                                }
                            )
                        })

                        new ReplyBuilder(selectInteraction).addEmbed(embed)
                        .addSelect(0, new StringSelectMenuBuilder({
                            customId: "work-profession-select",
                            placeholder: "Selecione o modo de jogo",
                            options: sector.professions.map((profession) => {
                                return {
                                    label: profession.name,
                                    value: profession.id,
                                    description: `Trabalhar como ${profession.name} em ${profession.mode}`,
                                    emoji: profession.emoji,
                                }
                            })
                        }))
                        .send(true)
                        return;
                    }
                    if (selectInteraction.customId == "work-profession-select"){
                        const sector = works.find(sector => sector.id == selectedSector)!
                        const profession = sector.professions.find(profession => profession.id == selectInteraction.values[0])!
                        selectedProfession = profession.id;

                        const cooldown = new Cooldown(7, "days")

                        embed.setFields()
                        .setDescription(`Você selecionou a profissão ${profession.emoji} **${profession.name}**
                        Jogo: **${sector.game}**
                        Modo de jogo: \` ${profession.mode} \`
                        Servidores aceitos: \`${profession.servers.join(`\`, \``)}\`
                        > Este modo garante:
                        ${emojiWorkXp} ${profession.exp} de xp por trabalho concluído
                        💳 ${profession.salary} de pontuação salarial por trabalho concluído

                        ❗ Após confirmar, você só poderá alterar sua profissão novamente ${time(~~(cooldown.getTime() / 1000), "R")}
                        `)

                        new ReplyBuilder(selectInteraction).addEmbed(embed)
                        .addButton(0, new ButtonBuilder({
                            customId: "work-profession-confirm", label: "Confirmar", style: ButtonStyle.Success 
                        }))
                        .send(true)
                    }
                }).setButtonFunction(async (buttonInteraction) => {
                    const sector = works.find(sector => sector.id == selectedSector)!
                    const profession = sector.professions.find(profession => profession.id == selectedProfession)!

                    // Create profession
                    
                    // Caso não tenha uma profissão
                    if (!memberData.work) {
                        memberData.work = {
                            gameID: sector.id,
                            profession: profession.id,
                            level: 0,
                            xp: 0,
                            salary: 0,
                            dones: []
                        }
                    } else {
                        // Caso já tenha uma profissão

                        memberData.work.profession = profession.id
                        memberData.work.gameID = sector.id

                    }
                    // Caso não tenha trabalhos concluídos dessa profissão
                    
                    const dones = memberData.work.dones || []
                    const currDone = dones.find(item => item.gameID === sector.id && item.professionID == profession.id);

                    if (!currDone) {
                        dones.push({
                            amount: 0,
                            gameID: sector.id,
                            professionID: profession.id,
                            xpEarned: 0,
                        })

                        memberData.work.dones = dones;
                    }
                    
                    // Configurações finais

                    if (roleWork && !member.roles.cache.has(roleWork.id)) await member.roles.add(roleWork);

                    embed.setDescription(`> Agora você é **${profession.emoji} ${profession.name}**
                    Jogue \` ${profession.mode} \` em **${sector.game}**, ao vencer uma partida
                    tire print da tela inteira e envie no chat ${cWork}`)

                    new ReplyBuilder(interaction).addEmbed(embed).send(true);
        
                    const time = `<t:${~~(Date.now() / 1000)}:t>`;
                    if (cLogs) cLogs.send({content: `${time} 💼 Trabalho **${member.user.tag}** agora trabalho como ${profession.id}`}).catch(() => {})

                    playersColl.saveDocData(member.id, memberData);

                    const cooldown = new Cooldown(7, "days");
                    playersColl.getDocManager(member.id).set("cooldowns.commands.work.profession", cooldown.getTime())

                })
                .send();

                return;
            }
            case "carreira": {
                const workMember = options.getMember("membro") as GuildMember || member

                const workMemberData = await playersColl.getDocData(workMember.id) as DocumentPlayer | undefined;

                if (!workMemberData || !workMemberData.registry) {
                    new Interruption(interaction, `${workMember} não está registrado!`)
                    return;
                }

                if (!workMemberData.work || !workMemberData.work.dones || workMemberData.work.dones.length < 1) {
                    new Interruption(interaction, `${workMember} não tem trabalhos concluídos!`)
                    return;
                }

                const level = workMemberData.work.level || 0;
                const xp = workMemberData.work.xp || 0;
                const xpRequired = systemExperience.getRequiredXp(level);

                const embed = DiscordCreate.simpleEmbed(config.colors.systems.work, `Carreira de **${workMember.displayName}**

                > ${ServerManager.findEmoji(guild, "workLevel")} Nível de trabalho: \` ${level} \`
                > ${ServerManager.findEmoji(guild, "workXp")} Experiência: \` ${xp} / ${xpRequired} \` 
                > ${TextUtils.progressBar(xp, xpRequired)} **${TextUtils.progresPercentage(xp, xpRequired).toFixed(0)}%** `)

                new EmbedMenu(interaction, embed, 6, 2).setEphemeral(true)
                .setItems(workMemberData.work.dones.map((item) => {
                    const sector = works.find(sector => sector.id === item.gameID)!
                    const profession = sector.professions.find(profession => profession.id == item.professionID)!;
                    return {
                        title: `${profession.emoji} ${profession.name}`,
                        content: `> 🎮 Jogo: **${sector.game}**
                        > Modo: \`${profession.mode}\`
                        > ${ServerManager.findEmoji(guild, "check")} Trabalhos concluídos: \`${item.amount}\`
                        > ${ServerManager.findEmoji(guild, "workXp")} Xp obitdo: \`${item.xpEarned}\``
                    }
                }))
                .display()
                return;
            }
        }

        
    },
    buttons: new Collection([
        ["work-approve-button", async (buttonInteraction) => {
            const member = buttonInteraction.member as GuildMember;
            const guild = buttonInteraction.guild!
            const message = buttonInteraction.message;
            
            buttonInteraction.deferUpdate()

            const memberData = await playersColl.getDocData(member.id) as DocumentPlayer | undefined;
            if (!memberData || !memberData.registry || (memberData.registry.level || 1) < 2) {
                return;
            }
            
            // Do things
            const mention = await guild.members.fetch(buttonInteraction.message.content).catch(() => undefined)
            if (!mention) {
                message.delete().catch(() => {})
                return;
            }
            
            const mentionData = await playersColl.getDocData(mention.id) as DocumentPlayer | undefined;
            if (!mentionData || !mentionData.work || !mentionData.work.profession) {
                message.delete().catch(() => {})
                return;
            }

            const image = message.attachments.at(0)
            if (!image) return;

            systemWork.accept(mention, image, mentionData)
            setTimeout(() => {
            }, 12000)

            message.delete().catch(() => {})
            
        }],
        ["work-recuse-button", async (buttonInteraction) => {
            const member = buttonInteraction.member as GuildMember;
            
            await buttonInteraction.deferUpdate()

            const memberData = await playersColl.getDocData(member.id) as DocumentPlayer | undefined;
            if (!memberData || !memberData.registry || (memberData.registry.level || 1) < 2) return;

            buttonInteraction.message.delete().catch(() => {})
        }]
    ])
})