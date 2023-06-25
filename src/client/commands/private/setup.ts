
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, CategoryChannelResolvable, ChannelType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder, TextChannel, codeBlock } from "discord.js";
import { Command } from "../../../app/base";
import { Interruption } from "../../../app/classes";
import { findChannel, convertHex, messageCollector } from "../../../app/functions";
import { infos } from "../../../settings/jsons";
import { config } from "../../..";

export default new Command({
    name: "setup",
    description: "Configurar sistemas e chats",
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    dmPermission: false,
    options: [
        {
            name: "information",
            description: "Define a mensagem base de informações",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "resources",
            description: "Define as configurações iniciais para os recursos",
            type: ApplicationCommandOptionType.Subcommand
        },
    ],
    async run(interaction) {
        const { options, guild } = interaction;

        switch(options.getSubcommand()){
            case "resources": {
                const categoryResources = guild.channels.cache.find(c => c.name == config.resources.title && c.type == ChannelType.GuildCategory);
                
                // Criar categoria recursos caso não existir e criar canais
                if (!categoryResources) {
                    guild.channels.create({
                        name: config.resources.title,
                        type: ChannelType.GuildCategory,
                    }).then(category => {

                        category.permissionOverwrites.create(guild.roles.everyone, {
                            SendMessages: false,
                            ViewChannel: false,
                            SendMessagesInThreads: true,
                            ReadMessageHistory: true
                        });

                        for (const cCategory of config.resources.categories) {
                            for (const cName of cCategory.subCategories) {
                                guild.channels.create({
                                    name: cCategory.name + "-" + cName,
                                    type: ChannelType.GuildText,
                                    topic: cCategory.description,
                                    parent: category
                                });
                            }
                        }
                    });

                } else { // Criar canais ainda não criados na categoria de recursos

                    const category = categoryResources as CategoryChannelResolvable;
                    let categoryIndex = 0;

                    for (const cCategory of config.resources.categories) {
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
                                });
                            }
                        }
                    }
                }
                return;
            }
            case "information": {
                const cInfo = findChannel(guild, config.guild.channels.info, ChannelType.GuildText);
                const cTerms = findChannel(guild, config.guild.channels.terms);
                if (!cInfo || !cTerms) {
                    new Interruption(interaction, "O chat de informações não está configurado!");
                    return;
                }

                interaction.deferReply({ephemeral: true});

                const {title, description, footer, image, thumb } = infos;

                const embed = new EmbedBuilder({
                    title, description, footer,
                    color: convertHex(config.colors.theme.primary)
                })
                .setImage(image)
                .setThumbnail(thumb);

                const row = new ActionRowBuilder<ButtonBuilder>({components: [
                    new ButtonBuilder({customId: "information-index", label: "Índice de informações", style: ButtonStyle.Primary}),
                    new ButtonBuilder({url: cTerms.url, label: "Termos", emoji: "📜", style: ButtonStyle.Link})
                ]});

                cInfo.send({embeds: [embed], components: [row]});
                return;
            }
            case "registrar":{
                const cRegister = findChannel(guild, config.guild.channels.register, ChannelType.GuildText) as TextChannel | undefined;
                if (!cRegister) {
                    new Interruption(interaction, "Não foi possível localizar o chat de registro!");
                    return;
                }
                
                const cGeneral = findChannel(guild, config.guild.channels.general, ChannelType.GuildText) as TextChannel | undefined;
                const cInfo = findChannel(guild, config.guild.channels.info, ChannelType.GuildText) as TextChannel | undefined;
                const cTerms = findChannel(guild, config.guild.channels.terms, ChannelType.GuildText) as TextChannel | undefined;
                
                if (!cInfo || !cTerms){
                    new Interruption(interaction, "Não foi possível localizar um dos chats: Informações ou Termos!");
                    return;
                }

                const onwer = guild.members.cache.get(guild.ownerId);

                const embed = new EmbedBuilder()
                .setTitle("Registrar")
                .setColor(config.colors.theme.primary as ColorResolvable)
                .setDescription(`📝 Clique no botão abaixo para se registrar.
                > Você precisará digitar seu nick!
                - Mais que 3 caracteres
                - Sem caracteres especiais
                - Sem espaços
                
                Se a interação falhar contate ${onwer} via DM.
                Após se registrar vá para ${cGeneral}
                `)
                .setImage(config.images.text.register);

                const row = new ActionRowBuilder<ButtonBuilder>({components: [
                    new ButtonBuilder({customId: "register-member-button", label: "Registrar", emoji: "📝", style: ButtonStyle.Success}),
                    new ButtonBuilder({url: cTerms.url, label: "Termos", emoji: "📜", style: ButtonStyle.Link}),
                    new ButtonBuilder({url: cInfo.url, label: "Informações", emoji: "📑", style: ButtonStyle.Link}),
                ]});

                cRegister.send({ embeds: [embed], components: [row] });

                interaction.reply({ephemeral: true, content: `Mensagem do chat registrar definida! ${cRegister}`});
                // new ReplyBuilder(interaction, true)
                // .setContent(`Mensagem do chat registrar definida! ${cRegister}`)
                // .send();
                // return;
            }
        }

    },
});