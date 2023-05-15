import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, Collection, ComponentType, EmbedBuilder, GuildMember, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Command } from "../../../app/base";
import { DocumentPlayer, DocumentResource, ResourceUploadProps, ZunderResourceUploadProps } from "../../../app/interfaces";
import { client, config, db } from "../../..";
import { BreakInteraction, MenuBuilder } from "../../../app/classes";
import { buttonCollector, convertHex, findChannel, findRole, logger, stringSelectCollector } from "../../../app/functions";

const membersUpload: Collection<string, ResourceUploadProps> = new Collection();
const membersEdit: Collection<string, ResourceUploadProps> = new Collection();
const membersReport: Collection<string, string> = new Collection();

export default new Command({
    name: "resources",
    description: "Zunder resources",
    type: ApplicationCommandType.ChatInput,
    visibility: "public",
    options: [
        {
            name: "upload",
            description: "upload",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "thumbnail",
                    description: "thumbnail",
                    type: ApplicationCommandOptionType.Attachment,
                },
                {
                    name: "banner",
                    description: "banner",
                    type: ApplicationCommandOptionType.Attachment,
                },
            ]
        },
        {
            name: "edit",
            description: "edit",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "information",
                    description: "information",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "id",
                            description: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ]
                },
                {
                    name: "thumbnail",
                    description: "thumbnail",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "id",
                            description: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: "image",
                            description: "image",
                            type: ApplicationCommandOptionType.Attachment,
                        },
                    ]
                },
                {
                    name: "banner",
                    description: "banner",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "id",
                            description: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: "image",
                            description: "image",
                            type: ApplicationCommandOptionType.Attachment,
                        },
                    ]
                },
            ]
        },
        {
            name: "delete",
            description: "delete",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "id",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ]
        },
        {
            name: "list",
            description: "list",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "member",
                    description: "member",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ]
        },
        {
            name: "get",
            description: "get",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "id",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ]
        },
        {
            name: "search",
            description: "search",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "title",
                    description: "title",
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true,
                    required: true,
                },
            ]
        },
        // {
        //     name: "migrate",
        //     description: "migrate",
        //     type: ApplicationCommandOptionType.Subcommand,
        //     options: [
        //         {
        //             name: "id",
        //             description: "id",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //         },
        //     ]
        // },
    ],
    async autoComplete(interaction) {
        const focusedValue = interaction.options.getFocused(true);
        switch (focusedValue.name){
            case "title": {
                const collection = await db.resources.collection.get();
                const choices = collection.docs.map(doc => {
                    const resource = doc.data() as DocumentResource;
                    return {name: resource.title.slice(0, 80), value: doc.id };
                });
                let filtered = choices.filter(c => c.name.startsWith(focusedValue.value));

                if (filtered.length < 1)
                filtered = choices.filter(c => c.name.toLowerCase().includes(focusedValue.value));
                
                if (filtered.length < 1) 
                filtered = choices.filter(c => c.name.toLowerCase().includes(focusedValue.value.toLowerCase()));

                await interaction.respond(filtered.slice(0, 25).map(c => ({ name: c.name, value: c.value })));
                return;
            }
        }
    },
    async run(interaction) {
        if (!interaction.inCachedGuild()) return;
        const { member, guild, channel, options } = interaction;

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData) {
            new BreakInteraction(interaction, "Apenas membros registrados podem utilizar este comando!");
            return;
        }

        if (guild.id !== client.mainGuildID){
            new BreakInteraction(interaction, "Este comando só pode ser usado no servidor principal!");
            return;
        }

        const subCommandGroup = options.getSubcommandGroup();
        const subCommand = options.getSubcommand();

        if (subCommandGroup == "edit"){
            const resourceId = options.getString("id", true);
            const resource = await db.resources.get(resourceId) as DocumentResource | undefined;
            if (!resource) {
                new BreakInteraction(interaction, "O recurso não foi encontrado! \nTalvez o id tenha sido digitado incorretamente!");
                return;
            }

            switch(subCommand){
                case "information":{
                    interaction.showModal(new ModalBuilder({
                        customId: "resource-edit-modal",
                        title: "📝 Editar recurso",
                        components: [
                            new ActionRowBuilder<TextInputBuilder>({components: [
                                new TextInputBuilder({
                                    customId: "resource-edit-title-input",
                                    label: "Título",
                                    placeholder: "Editar título do recurso",
                                    style: TextInputStyle.Short,
                                    value: resource.title,
                                    required: true
                                })
                            ]}),
                            new ActionRowBuilder<TextInputBuilder>({components: [
                                new TextInputBuilder({
                                    customId: "resource-edit-description-input",
                                    label: "Descrição",
                                    placeholder: "Editar descrição do recurso",
                                    style: TextInputStyle.Paragraph,
                                    value: resource.description,
                                    required: true
                                })
                            ]}),
                            new ActionRowBuilder<TextInputBuilder>({components: [
                                new TextInputBuilder({
                                    customId: "resource-edit-url-input",
                                    label: "Link de acesso",
                                    placeholder: "Editar link de acesso do recurso",
                                    style: TextInputStyle.Short,
                                    value: resource.acessURL,
                                    required: true
                                })
                            ]}),
                        ]
                    }));
                    return;
                }
                case "thumbnail":{

                    return;
                }
                case "banner":{

                    return;
                }
            }
            return;
        }

        switch(subCommand){
            case "upload":{
                const initialResource: ZunderResourceUploadProps = {
                    authorID: member.id, guildID: guild.id, reports: new Array(),
                    title: "inserir", description: "inserir", acessURL: "inserir",
                };

                const thumbnail = options.getAttachment("thumbnail");
                const banner = options.getAttachment("banner");

                if (thumbnail){
                    if ((thumbnail.size / 1024 / 1024) > 8){
                        new BreakInteraction(interaction, "A imagem para thumbnail que você enviou é muito pesada!");
                        return;
                    }
                    thumbnail.name = "thumb.png";
                    initialResource.thumbAttach = thumbnail;
                }
                if (banner){
                    if ((banner.size / 1024 / 1024) > 8){
                        new BreakInteraction(interaction, "A imagem para o banner que você enviou é muito pesada!");
                        return;
                    }
                    banner.name = "banner.png";
                    initialResource.bannerAttach = banner;
                }

                membersUpload.set(member.id, initialResource);

                interaction.showModal(new ModalBuilder({
                    customId: "resource-upload-modal",
                    title: "📁 Enviar recurso",
                    components: [
                        new ActionRowBuilder<TextInputBuilder>({components: [new TextInputBuilder({
                            customId: "resource-upload-title-input",
                            label: "🏷️ Título",
                            placeholder: "Digite o título do recurso...",
                            maxLength: 100,
                            minLength: 6,
                            style: TextInputStyle.Short,
                            required: true,
                        })]}),
                        new ActionRowBuilder<TextInputBuilder>({components: [new TextInputBuilder({
                            customId: "resource-upload-description-input",
                            label: "📄 Descrição",
                            placeholder: "Digite a descrição do recurso...",
                            maxLength: 3800,
                            minLength: 10,
                            style: TextInputStyle.Paragraph,
                            required: true,
                        })]}),
                        new ActionRowBuilder<TextInputBuilder>({components: [new TextInputBuilder({
                            customId: "resource-upload-url-input",
                            label: "🔗 Link de acesso",
                            placeholder: "Insira o link de acesso do recurso...",
                            style: TextInputStyle.Short,
                            required: true,
                        })]}),
                    ]
                }));
                return;
            }
            case "list":{
                // const currCooldown = memberData.cooldowns?.commands?.resources?.list || Date.now()
                // if (Date.now() < currCooldown) {
                //     new BreakInteraction(interaction, `Você poderá usar esse comando novamente <t:${~~(currCooldown / 1000)}:R>`)
                //     return;
                // }

                const mention = options.getMember("member") || member;
                const mentionData = await db.players.get(mention.id) as DocumentPlayer | undefined;

                if (!mentionData) {
                    new BreakInteraction(interaction, `${mention} não está registrado`);
                    return;
                }
                
                const snapshot = await db.resources.collection.where("authorID", "==", mention.id).get();
                if (snapshot.docs.length < 1) {
                    new BreakInteraction(interaction, `${mention} não tem recursos enviados`);
                    return;
                }

                new MenuBuilder({
                    mainEmbed: new EmbedBuilder({
                        title: "📁 Lista de recursos",
                        description: `Exibindo todos os recursos de ${mention}
                        > Total: \`${snapshot.docs.length}\` recursos`,
                        color: convertHex(config.colors.systems.resources)
                    }),
                    maxItemsPerPage: 6,
                    type: "Blocks",
                    ephemeral: true,
                    items: snapshot.docs.map(doc => {
                        const resource = doc.data() as DocumentResource;
                        return {
                            title: resource.title,
                            description: `> [Acessar o recurso](${resource.messageURL})
                            > ID \`${doc.id}\``,
                            thumbnail: resource.thumbURL,
                            color: convertHex(config.colors.systems.resources)
                        };
                    })
                }).show(interaction, member);

                // db.players.update(member.id, 
                //     "cooldowns.commands.resources.list", 
                //     new Cooldown(4, "minutes").endTime
                // );
                // const cooldown = new Cooldown(4, "MINUTES");
                // playersColl.getDocManager(member.id).set("cooldowns.commands.resources.list", cooldown.getTime())
                return;
            }
            case "get":{
                const id = options.getString("id", true);

                const resource = await db.resources.get(id) as DocumentResource | undefined;
                if (!resource) {
                    new BreakInteraction(interaction, "O recurso não foi encontrado! \nTalvez o id tenha sido digitado incorretamente!");
                    return;
                }

                interaction.reply({ ephemeral: true, embeds: [
                    new EmbedBuilder({
                        description: `Ir até **${resource.title}** [clicando aqui](${resource.messageURL})`,
                        color: convertHex(config.colors.systems.resources)
                    })
                ]});
                return;
            }
            case "search":{
                const id = options.getString("title", true);

                const resource = await db.resources.get(id) as DocumentResource | undefined;
                if (!resource) {
                    new BreakInteraction(interaction, "O recurso não foi encontrado!");
                    return;
                }

                interaction.reply({ ephemeral: true, embeds: [
                    new EmbedBuilder({
                        description: `Ir até **${resource.title}** [clicando aqui](${resource.messageURL})`,
                        color: convertHex(config.colors.systems.resources)
                    })
                ]});
                return;
            }
            // case "migrate":{
            
            //     return;
            // }
            case "delete":{
                // const currCooldown = memberData.cooldowns?.commands?.resources?.delete || Date.now()
                // if (Date.now() < currCooldown) {
                //     new BreakInteraction(interaction, `Você poderá usar esse comando novamente <t:${~~(currCooldown / 1000)}:R>`)
                //     return;
                // }
                const id = options.getString("id", true).trim();
                const resource = await db.resources.get(id) as DocumentResource | undefined;
                if (!resource) {
                    new BreakInteraction(interaction, `Não foi encontrado nenhum recurso com o id: \`${id}\`!` +
                    "\nVerifique se você digitou o id corretamente");
                    return;
                }

                if (resource.authorID != member.id && memberData.registry.level < 4){
                    new BreakInteraction(interaction, "Apenas Líderes e Admins podem deletar o recurso de outra pessoa!");
                    return;
                }

                const message = await interaction.reply({
                    ephemeral: true, embeds: [
                        new EmbedBuilder({
                            color: convertHex(config.colors.danger),
                            description:`O recurso **${resource.title}** será deletado permanentemente!
                        Deseja mesmo deletar este recurso?`
                        })
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>({components: [
                            new ButtonBuilder({
                                customId: "resource-delete-confirm-button", 
                                label: "Confirmar", style: ButtonStyle.Success
                            })
                        ]})
                    ]
                });

                buttonCollector(message).on("collect", async subInteraction => {
                    const resource = await db.resources.get(id) as DocumentResource | undefined;
                    if (!resource) {
                        new BreakInteraction(subInteraction, "O recurso não foi encontrado!", {replace: true});
                        return;
                    }
                    
                    const channelName = `${resource.category.name}-${resource.category.subCategory}`;
                    const channel = findChannel(guild, channelName, ChannelType.GuildText, config.resources.title);
                    
                    if (!channel) {
                        new BreakInteraction(subInteraction, "A mensagem do recurso não foi encontrada!", {replace: true});
                        return;
                    } 
                    
                    const message = await channel.messages.fetch(id).catch(() => null);
                    if (!message) {
                        new BreakInteraction(subInteraction, "A mensagem do recurso não foi encontrada!", {replace: true});
                        return;
                    }
            
                    const authorData = await db.players.get(resource.authorID) as DocumentPlayer | undefined;
                    if (authorData && authorData.resources) {
                        await db.players.update(member.id, "resources", { id }, "arrayRemove");
                    }

                    await db.resources.delete(id);
                    message.delete().catch(() => {});

                    subInteraction.update({
                        components: [], embeds: [],
                        content: "O recurso foi deletado com sucesso!", 
                    });
                });
                return;
            }
        }
    },
    modals: {
        "resource-upload-modal": async interaction => {
            if (!interaction.inCachedGuild()) return;
            const { member, fields, guild } = interaction;

            await interaction.deferReply({ephemeral: true});

            const initialResource = membersUpload.get(member.id);
            if (!initialResource){
                new BreakInteraction(interaction, "O recurso inicial não foi encontrado! \nUtilize o comando novamente", {replace: true});
                return;
            }

            const title = fields.getTextInputValue("resource-upload-title-input");
            const description = fields.getTextInputValue("resource-upload-description-input");
            const acessURL = fields.getTextInputValue("resource-upload-url-input");

            const embedResource = new EmbedBuilder({
                title, description, color: convertHex(config.colors.secondary),
                thumbnail: { url: "attachment://thumb.png" },
                image: { url: "attachment://banner.png" }
            });

            try {
                embedResource.setURL(acessURL);
            } catch (err) {
                new BreakInteraction(interaction, "O link de acesso que você enviou não é válido!", {replace: true});
                return;
            }

            initialResource.title = title;
            initialResource.description = description;
            initialResource.acessURL = acessURL;

            const files: AttachmentBuilder[] = [];

            if (initialResource.thumbAttach){
                files.push(new AttachmentBuilder(initialResource.thumbAttach.url, {name: "thumb.png"}));
            }
            if (initialResource.bannerAttach){
                files.push(new AttachmentBuilder(initialResource.bannerAttach.url, {name: "banner.png"}));
            }

            const embed = new EmbedBuilder({
                color: convertHex(config.colors.progress.red),
                description: "Selecione a categoria que deseja"
            });

            const message = await interaction.editReply({
                files, embeds: [embedResource, embed],
                components: [new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                    new StringSelectMenuBuilder({
                        customId: "resource-upload-category-select",
                        placeholder: "Selecionar categoria",
                        options: config.resources.categories.map(c => { 
                            return {label: c.name, description: c.description, value: c.name };
                        })
                    })
                ]})],
            });

            let resourceCategory = config.resources.categories[0];

            const selectCollector = stringSelectCollector(message).on("collect", (subInteraction) => {
                const selected = subInteraction.values[0];

                switch(subInteraction.customId){
                    case "resource-upload-category-select":{
                        resourceCategory = config.resources.categories.find(c => c.name == selected)!;
                        embedResource.setColor(convertHex(config.colors.progress.yellow));
                        embed.setColor(convertHex(config.colors.progress.yellow))
                        .setDescription(`> **${resourceCategory.name}/**
                        Selecione a sub categoria do recurso`);

                        subInteraction.update({
                            embeds: [embedResource, embed], 
                            components: [new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                                new StringSelectMenuBuilder({
                                    customId: "resource-upload-subcategory-select",
                                    placeholder: "Selecionar sub categoria",
                                    options: resourceCategory.subCategories.map(c => ({label: c, value: c}))
                                })
                            ]})]
                        });
                        return;
                    }
                    case "resource-upload-subcategory-select":{
                        initialResource.category = { name: resourceCategory.name, subCategory: selected };

                        embedResource.setColor(convertHex(config.colors.progress.green));
                        embed
                        .setColor(convertHex(config.colors.progress.green))
                        .setDescription(`> **${resourceCategory.name}/${selected}**
                        Deseja confirmar o envio do recurso?`);

                        subInteraction.update({
                            embeds: [embedResource, embed], 
                            components: [new ActionRowBuilder<ButtonBuilder>({components: [
                                new ButtonBuilder({
                                    customId: "resource-upload-confirm-button",
                                    label: "Confirmar envio",
                                    style: ButtonStyle.Success
                                })
                            ]})]
                        });
                        selectCollector.stop();
                        return;
                    }
                }
            });

            const collector = buttonCollector(message).on("collect", async subInteraction => {
                await subInteraction.deferUpdate({fetchReply: true});
                const cName = `${initialResource.category?.name}-${initialResource.category?.subCategory}`;
                const channel = findChannel(guild, cName, ChannelType.GuildText);

                if (!channel) {
                    new BreakInteraction(interaction, "O chat para o recurso não está configurado!", {replace: true});
                    return;
                }

                embedResource.setColor(convertHex(config.colors.systems.resources));
                
                const message = await channel.send({embeds: [embedResource], components: [
                    new ActionRowBuilder<ButtonBuilder>({components: [
                        new ButtonBuilder({url: initialResource.acessURL, label: "Acessar", style: ButtonStyle.Link}),
                        new ButtonBuilder({customId: "resource-report-button", label: "Reportar", style: ButtonStyle.Danger}),
                    ]})
                ], files});

                embedResource.setFields(
                    {name: "ID do recurso", value: message.id, inline: true},
                    {name: "ID do autor", value: member.id, inline: true}
                );

                message.edit({embeds: [embedResource]});

                await message.react("👍");
                await message.react("👎");

                if (message.embeds[0].thumbnail?.url) initialResource.thumbURL = message.embeds[0].thumbnail.url;
                if (message.embeds[0].image?.url) initialResource.bannerURL = message.embeds[0].image.url;

                initialResource.messageID = message.id;
                initialResource.messageURL = message.url;

                delete initialResource.thumbAttach;
                delete initialResource.bannerAttach;

                await db.resources.create({id: message.id, data: initialResource});
                await db.players.update(member.id, "resources", {id: message.id}, "arrayUnion");

                embed.setDescription(`Seu recurso foi enviado em ${channel}! Confira [clicando aqui](${message.url})`);
                await interaction.editReply({embeds: [embed], components: [], files: []});

                const role = findRole(guild, resourceCategory.role); 
                if (role) {
                    const notifyMsg = await channel.send({content: `||${role}||`});
                    setTimeout(() => {
                        notifyMsg.delete().catch(logger);
                    }, 20 * 1000);
                    return;
                }

                membersUpload.delete(member.id);
                collector.stop();
            });
        },
        "resource-report-modal": async interaction => {
            if (!interaction.inCachedGuild()) return;
            const { member, fields } = interaction;

            await interaction.deferReply({ephemeral: true});

            const resourceId = membersReport.get(member.id);
            const resource = await db.resources.get(resourceId || "unknow") as DocumentResource | undefined;
            if (!resource){
                new BreakInteraction(interaction, "O recurso não foi encontrado!");
                return;
            }

            const reason = fields.getTextInputValue("resource-report-reason-input");
            resource.reports.push({id: member.id, reason});
            db.resources.update(resource.messageID, "reports", resource.reports);

            interaction.editReply({content: `Você reportou o recurso ${resource.title} por \`${reason}\``});
        }
    },
    buttons: {
        "resource-report-button": async interaction => {
            if (!interaction.inCachedGuild()) return;
            const { member, message, guild } = interaction;
            if (message.embeds.length < 1 || message.embeds[0].fields.length < 1) return;

            const resourceId = message.embeds[0].fields[0].value;
            const authorId = message.embeds[0].fields[1].value;

            /* if (member.id == authorId){
                new BreakInteraction(interaction, 
                    `Você não pode reportar seu próprio recurso! 
                    Se deseja excluí-lo utilize \`/recursos deletar\``
                );
                return;
            } */

            const resource = await db.resources.get(resourceId) as DocumentResource | undefined;
            if (!resource){
                new BreakInteraction(interaction, "O recurso não foi encontrado!");
                return;
            }
            
            if (resource.reports.find(r => r.id == member.id)){
                new BreakInteraction(interaction, "Você já reportou este recurso!");
                return;
            }

            const author = guild.members.cache.get(authorId);

            interaction.showModal(new ModalBuilder({
                customId: "resource-report-modal",
                title: "Reportar recurso",
                components: [
                    new ActionRowBuilder<TextInputBuilder>({components: [
                        new TextInputBuilder({
                            customId: "resource-report-reason-input",
                            label: "Motivo",
                            placeholder: "Digite o motivo para reportar este recurso!",
                            style: TextInputStyle.Short,
                            required: true
                        })
                    ]}),
                    new ActionRowBuilder<TextInputBuilder>({components: [
                        new TextInputBuilder({
                            customId: "resource-report-message-input",
                            label: "Anotação",
                            placeholder: "Apenas uma anotação para ser lida",
                            value: `Recurso ${resource.title} de ${author?.displayName || "Autor desconhecido"} \nReportar um recurso indevidamente gera punições`,
                            style: TextInputStyle.Paragraph,
                            required: false
                        })
                    ]}),
                ]
            }));

            membersReport.set(member.id, resourceId);
        }
    }
});

// type SubCommand = "upload" /* | "edit" */ | "list" | "get" | "search" | "delete" | "migrate";