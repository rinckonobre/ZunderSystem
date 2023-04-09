import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, CategoryChannelResolvable, ChannelType, ChatInputCommandInteraction, codeBlock, ColorResolvable, EmbedBuilder, TextChannel } from "discord.js";
import { config } from "../..";

import { resources } from "../../config.json";
import { informations } from "../../jsons";
import { Command, DiscordCreate, Interruption, ReplyBuilder, ServerManager, TextUtils } from "../../structs";

const ephemeral = true;

export default new Command({
    name: "setup",
    description: "Configurar sistemas e chats",
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    options: [
        {
            name: "informações",
            description: "Define a mensagem base de informações",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "recursos",
            description: "Define as configurações iniciais para os recursos",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "registrar",
            description: "Define a mensagem do chat registrar",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "jsonmessage",
            description: "Converte uma mensagem em uma string JSON",
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    async run({interaction, options}) {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;
        //const member = interaction.member as GuildMember;
        const guild = interaction.guild;

        switch(options.getSubcommand()){
            case 'recursos': {
                if (!guild?.channels) {
                    interaction.reply({ephemeral: true, content: "A guilda não tem canais"})
                    return;
                }

                const categoryResources = guild.channels.cache.find(c => c.name == resources.title && c.type == ChannelType.GuildCategory);
                

                // Criar categoria recursos caso não existir e criar canais
                if (!categoryResources) {
                    guild.channels.create({
                        name: resources.title,
                        type: ChannelType.GuildCategory,
                    }).then(category => {

                        category.permissionOverwrites.create(guild.roles.everyone, {
                            SendMessages: false,
                            ViewChannel: false,
                            SendMessagesInThreads: true,
                            ReadMessageHistory: true
                        })

                        for (const cCategory of resources.categories) {
                            for (const cName of cCategory.subCategories) {
                                guild.channels.create({
                                    name: cCategory.name + "-" + cName,
                                    type: ChannelType.GuildText,
                                    topic: cCategory.description,
                                    parent: category
                                })
                            }
                        }

                    })

                } else { // Criar canais ainda não criados na categoria de recursos

                    const category = categoryResources as CategoryChannelResolvable
                    let categoryIndex = 0;

                    for (const cCategory of resources.categories) {
                        let channelIndex = 0;

                        for (const cName of cCategory.subCategories) {
                            const channel = guild.channels.cache.find(c => c.name == `${cCategory.name}-${cName}` && c.parent == category);
                            if (!channel) {
                                guild.channels.create({
                                    name: cCategory.name + "-" + cName,
                                    type: ChannelType.GuildText,
                                    topic: cCategory.description,
                                    parent: category,
                                    position: categoryIndex + channelIndex
                                })
                            };
                        }
                    }
                }
                return;
            }
            case "jsonmessage": {
                if (interaction.channel instanceof TextChannel) {
                    new ReplyBuilder(interaction, true)
                    .setContent(`Digite a mensagem ou apenas \`cancelar\``)
                    .send()

                    const collector = DiscordCreate.messageCollector(interaction.channel, {}, (message) => {
                        if (message.member?.id != interaction.user.id) return;
                        
                        const content = message.content;
                        message.delete().catch(() => {})

                        if (content.toLowerCase().trim() == "cancelar") {
                            new ReplyBuilder(interaction)
                            .setContent("Ação cancelada!")
                            .send(true)
                            collector.stop()
                            return;
                        }

                        new ReplyBuilder(interaction)
                        .setContent(codeBlock(JSON.stringify(message.content)))
                        .send(true)
                        collector.stop()
                    })
                } else {
                    new Interruption(interaction, "Você precista estar em um chat de texto para usar este comando!");
                }
                return;
            }
            case "informações": {
                const cInfo = ServerManager.findChannel(guild, config.guild.channels.info) as TextChannel | undefined;
                const cTerms = ServerManager.findChannel(guild, config.guild.channels.terms);
                if (!cInfo || !cTerms) {
                    new Interruption(interaction, "O de informações não está configurado!");
                    return;
                }

                interaction.deferReply({ephemeral: true});

                const {title, description, footer, image, thumbnail } = informations

                

                const embed = new EmbedBuilder()
                .setColor(config.colors.primary as ColorResolvable)
                .setTitle(title)
                .setThumbnail(thumbnail)
                .setImage(image)
                .setDescription(TextUtils.jsonParse(description) || "erro")
                .setFooter(footer);

                const row = new ActionRowBuilder<ButtonBuilder>({components: [
                    new ButtonBuilder({customId: "information-index", label: "Índice de informações", style: ButtonStyle.Primary}),
                    new ButtonBuilder({url: cTerms.url, label: "Termos", emoji: "📜", style: ButtonStyle.Link})
                ]})

                cInfo.send({embeds: [embed], components: [row]});
            }
            case "registrar":{
                const cRegister = ServerManager.findChannel(guild, config.guild.channels.register, ChannelType.GuildText) as TextChannel | undefined;
                if (!cRegister) {
                    new Interruption(interaction, "Não foi possível localizar o chat de registro!");
                    return;
                }
                
                const cGeneral = ServerManager.findChannel(guild, config.guild.channels.general, ChannelType.GuildText) as TextChannel | undefined;
                const cInfo = ServerManager.findChannel(guild, config.guild.channels.info, ChannelType.GuildText) as TextChannel | undefined;
                const cTerms = ServerManager.findChannel(guild, config.guild.channels.terms, ChannelType.GuildText) as TextChannel | undefined;
                
                if (!cInfo || !cTerms){
                    new Interruption(interaction, "Não foi possível localizar um dos chats: Informações ou Termos!");
                    return;
                }

                const onwer = guild.members.cache.get(guild.ownerId)

                const embed = new EmbedBuilder()
                .setTitle("Registrar")
                .setColor(config.colors.primary as ColorResolvable)
                .setDescription(`📝 Clique no botão abaixo para se registrar.
                > Você precisará digitar seu nick!
                - Mais que 3 caracteres
                - Sem caracteres especiais
                - Sem espaços
                
                Se a interação falhar contate ${onwer} via DM.
                Após se registrar vá para ${cGeneral}
                `)
                .setImage(config.images.text.register)

                const row = new ActionRowBuilder<ButtonBuilder>({components: [
                    new ButtonBuilder({customId: "register-member-button", label: "Registrar", emoji: "📝", style: ButtonStyle.Success}),
                    new ButtonBuilder({url: cTerms.url, label: "Termos", emoji: "📜", style: ButtonStyle.Link}),
                    new ButtonBuilder({url: cInfo.url, label: "Informações", emoji: "📑", style: ButtonStyle.Link}),
                ]})

                cRegister.send({ embeds: [embed], components: [row] });

                new ReplyBuilder(interaction, true)
                .setContent(`Mensagem do chat registrar definida! ${cRegister}`)
                .send()
                return;
            }
        }

    },
})