import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, Attachment, AttachmentBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, ChatInputCommandInteraction, Collection, ColorResolvable, ComponentType, EmbedBuilder, Guild, GuildMember, MessageCollector, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextChannel, TextInputStyle, codeBlock } from "discord.js";
import { config, db } from "../..";
import { logger, wait } from "../../functions";
import { toHexColor } from "../../functions/aplication/convert";
import { BreakInteraction, Command, DiscordCreate, DiscordTools, DocumentPlayer, DocumentResource, EmbedMenuBuilder, Files, ResourceManager, ServerManager, ZunderResourceUploadProps } from "../../structs";

export default new Command({
    name: "resources",
    nameLocalizations: { "pt-BR": "recursos" },
    description: "📂 Zunder Resources",
    descriptionLocalizations: { "pt-BR": "📂 Recursos da Zunder" },
    visibility: "public",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "upload",
            nameLocalizations: { "pt-BR": "enviar" },
            description: "📂 Upload a new resource",
            descriptionLocalizations: { "pt-BR": "📂 Envia um novo recurso" },
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "thumb",
                    description: "🌌 Add resource thumbnail",
                    descriptionLocalizations: { "pt-BR": "🌌 Adicionar thumbnail no recurso" },
                    type: ApplicationCommandOptionType.Attachment,
                },
                {
                    name: "banner",
                    description: "🏞️ Add resource banner",
                    descriptionLocalizations: { "pt-BR": "🏞️ Adicionar banner no recurso" },
                    type: ApplicationCommandOptionType.Attachment,
                }
            ]
        },
        {
            name: "edit",
            nameLocalizations: { "pt-BR": "editar"},
            description: "✏️ Edit a resource",
            descriptionLocalizations: { "pt-BR": "✏️ Editar um recurso" },
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "Resource id",
                    descriptionLocalizations: { "pt-BR": "Id do recurso" },
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ]
        },
        {
            name: "list",
            nameLocalizations: { "pt-BR": "listar" },
            description: "🗂️ Show a resource list",
            descriptionLocalizations: { "pt-BR": "🗂️ Exibe uma lista de recursos" },
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "member",
                    nameLocalizations: { "pt-BR": "membro" },
                    description: "list a member's resources",
                    descriptionLocalizations: { "pt-BR": "listar os recursos de um membro" },
                    type: ApplicationCommandOptionType.String,
                }
            ]
        },
        {
            name: "search",
            nameLocalizations: { "pt-BR": "pesquisar" },
            description: "Search a resource",
            descriptionLocalizations: { "pt-BR": "Pesquisa um recurso" },
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "title",
                    nameLocalizations: { "pt-BR": "titulo" },
                    description: "Resources' title",
                    descriptionLocalizations: { "pt-BR": "Título do recurso" },
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true,
                    required: true
                }
            ]
        },
        {
            name: "fetch",
            nameLocalizations: { "pt-BR": "obter" },
            description: "Fetch a resource by id",
            descriptionLocalizations: { "pt-BR": "Busca um recurso por id" },
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "Resource's id",
                    descriptionLocalizations: { "pt-BR": "Id do recurso" },
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
            ]
        },
        {
            name: "delete",
            nameLocalizations: { "pt-BR": "deletar" },
            description: "🗑️ Delete a resource",
            descriptionLocalizations: { "pt-BR": "🗑️ Deleta um recurso" },
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "Resource's id",
                    descriptionLocalizations: { "pt-BR": "Id do recurso" },
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
            ]
        }
    ],
    async autcomplete({interaction, options}) {
        const focusedValue = options.getFocused(true);
        switch (focusedValue.name){
            case "title": {
                const collection = await db.resources.collection.get()
                const choices = collection.docs.map(doc => {
                    const resource = doc.data() as DocumentResource;
                    return {name: resource.title.slice(0, 80), value: doc.id }
                })
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
    async run({client, interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { guild, member, channel } = interaction;

        if (!(channel instanceof TextChannel)){
            new BreakInteraction(interaction, "Este comando não pode ser usado neste chat!");
            return;
        }

        if (guild.id != client.mainGuildID) {
            new BreakInteraction(interaction, "Este comando só pode ser usado no servidor principal!");
            return;
        }
        
        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData || !memberData.registry){
            new BreakInteraction(interaction, "Apenas membros registrados podem utilizar este comando!");
            return;
        }

        const rows = [
            new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>(),
            new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>(),
            new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>(),
        ]
        
        switch ((options.getSubcommand()) as SubCommands){
            case "upload": {
                
                const currCooldown = memberData.cooldowns?.commands?.resources?.upload || Date.now()
                if (Date.now() < currCooldown) {
                    new BreakInteraction(interaction, `Você poderá usar esse comando novamente <t:${~~(currCooldown / 1000)}:R>`)
                    return;
                }

                const modal = new ModalBuilder({
                    title: "Enviar recurso",
                    customId: "resource-upload-modal",
                    components: [
                        DiscordCreate.textInput({ type: ComponentType.TextInput,
                            customId: "resource-upload-title",
                            label: "Definir título",
                            minLength: 8, maxLength: 150,
                            placeholder: "Escreva o título do seu recurso",
                            required: true,
                            style: TextInputStyle.Short
                        }),
                        DiscordCreate.textInput({ type: ComponentType.TextInput,
                            customId: "resource-upload-description",
                            label: "Definir descrição",
                            minLength: 20, maxLength: 4000,
                            placeholder: "Descreva um pouco sobre o seu recurso",
                            required: true,
                            style: TextInputStyle.Paragraph
                        }),
                        DiscordCreate.textInput({ type: ComponentType.TextInput,
                            customId: "resource-upload-acessurl",
                            label: "Definir link para acesso",
                            minLength: 1,
                            placeholder: "Insira o link para acessar seu recurso",
                            required: true,
                            style: TextInputStyle.Short
                        })
                    ]
                })

                const zunderResource: ZunderResourceUploadProps = {
                    authorID: member.id, 
                    guildID: guild.id,
                    title: "", description: "", acessURL: "",
                    reports: new Array()
                };

                const [ thumb, banner ] = [ options.getAttachment("thumb"), options.getAttachment("banner") ]

                if (thumb) {
                    if (Files.checkAttachmentMbSize(thumb, ">", 8)) {
                        new BreakInteraction(interaction, "O arquivo que você enviou para thumbnail execede o limite de `8 mbs`")
                        return;
                    }
                    zunderResource.thumbAttach = thumb;
                }
                if (banner) {
                    if (Files.checkAttachmentMbSize(banner,">", 8)) {
                        new BreakInteraction(interaction, "O arquivo que você enviou para thumbnail execede o limite de `8 mbs`")
                        return;
                    }
                    zunderResource.bannerAttach = banner;
                }

                ResourceManager.tempUpload.set(member.id, zunderResource);

                await interaction.showModal(modal);
                return;
            }
            case "list": {
                // const currCooldown = memberData.cooldowns?.commands?.resources?.list || Date.now()
                // if (Date.now() < currCooldown) {
                //     new BreakInteraction(interaction, `Você poderá usar esse comando novamente <t:${~~(currCooldown / 1000)}:R>`)
                //     return;
                // }

                const mention = options.getMember("membro") as GuildMember || member;
                const mentionData = await db.players.get(mention.id) as DocumentPlayer | undefined;

                if (!mentionData || !mentionData.registry) {
                    new BreakInteraction(interaction, `${mention} não está registrado`);
                    return;
                }
                
                const snapshot = await db.resources.collection.where("authorID", "==", mention.id).get();
                if (!mentionData.resources || mentionData.resources.length < 1 || snapshot.docs.length < 1) {
                    new BreakInteraction(interaction, `${mention} não tem recursos enviados`);
                    return;
                }

                new EmbedMenuBuilder({ title: "📁 Lista de recursos", maxItems: 6, type: "BLOCK_LIST" })
                .setItems(snapshot.docs.map(doc => {
                    const resource = doc.data() as DocumentResource;
                    
                    return {
                        title: resource.title,
                        content: `> [Acessar o recurso](${resource.messageURL})
                        > ID \`${doc.id}\``,
                        thumb: resource.thumbURL,
                        color: config.colors.systems.resources as ColorResolvable
                    }
                }))
                .editEmbed((embed) => embed.setDescription(`Exibindo todos os recursos de ${mention}
                > Total: \`${snapshot.docs.length}\` recursos`))
                .send(interaction, member)


                // const cooldown = new Cooldown(4, "MINUTES");
                // playersColl.getDocManager(member.id).set("cooldowns.commands.resources.list", cooldown.getTime())
                return;
            }
            case "edit": {
                const id = options.getString("id", true).trim();
                const resource = await db.resources.get(id) as DocumentResource | undefined;
                if (!resource) {
                    new BreakInteraction(interaction, `Não foi encontrado nenhum recurso com o id: \`${id}\`!` +
                    "\nVerifique se você digitou o id corretamente");
                    return;
                }

                const resourceMsg = await ResourceManager.findMessage(id, resource, guild);
                if (!resourceMsg){
                    new BreakInteraction(interaction, "Ocorreu um erro ao buscar o recurso! Contate o desenvolvedor");
                    return;
                }
                const backupEmbed = resourceMsg.embeds[0].data

                if (backupEmbed.fields?.[1].value != member.id) {
                    new BreakInteraction(interaction, "Apenas o autor do recurso pode editar ele!");
                    return;
                }


                let newEmbed = new EmbedBuilder(backupEmbed)
                newEmbed.setFooter({text: "Isso é um preview do seu recurso original", iconURL: config.images.status.existing})
                .setURL(resource.acessURL)

                const mainMenuSelect = new StringSelectMenuBuilder({
                    customId: "resource-edit-select",
                    placeholder: "Selecione o que deseja editar no seu recurso",
                    options: [
                        {label: "Título", emoji: "✏️",value: "title", description: "Editar o título do recurso"},
                        {label: "Descrição", emoji: "📝",value: "description", description: "Editar a descrição do recurso"},
                        {label: "Link", emoji: "🔗",value: "url", description: "Editar o link de acesso do recurso"},
                        {label: "Thumb", emoji: "🌌",value: "thumb", description: "Editar a imagem da thumb do recurso"},
                        {label: "Banner", emoji: "🏞️",value: "banner", description: "Editar a imagem do banner do recurso"},
                    ]
                })

                const mainMenuButtons = [
                    new ButtonBuilder({customId: "resource-edit-save-button", label: "Salvar", style: ButtonStyle.Success}),
                    new ButtonBuilder({customId: "resource-edit-discard-button", label: "Descartar", style: ButtonStyle.Danger}),
                    new ButtonBuilder({customId: "resource-edit-cancel-button", label: "Cancelar", style: ButtonStyle.Danger}),
                ]

                const backButton = new ButtonBuilder({customId: "resource-edit-back-button", label: "Voltar", style: ButtonStyle.Danger});

                let currentElement: string;
                let currentCollector: MessageCollector;

                const embedPrompt = DiscordCreate.simpleEmbed(config.colors.default, "-")

                async function backToMenu(interaction: ButtonInteraction | StringSelectMenuInteraction | ChatInputCommandInteraction){
                    const options = {embeds: [newEmbed], files, components: [
                        DiscordTools.createRowSelects(mainMenuSelect),
                        DiscordTools.createRowButtons(...mainMenuButtons),
                    ]}

                    if (interaction.isChatInputCommand()) {
                        if (interaction.replied) {
                            return await interaction.editReply(options);
                        }
                        return await interaction.reply({ephemeral: true, ...options});
                    }
                    else return await interaction.update(options);
                }

                const files: Array<AttachmentBuilder> = []

                const msg = await backToMenu(interaction);

                DiscordTools.selectCollector({source: msg, async collect(subInteraction){
                    currentElement = subInteraction.values[0];

                    const imageEditButtons = [
                        backButton,
                        new ButtonBuilder({customId: "resource-edit-image-change-button", label: "Alterar", style: ButtonStyle.Primary}),
                        new ButtonBuilder({customId: "resource-edit-image-remove-button", label: "Remover", style: ButtonStyle.Danger})
                    ];
                    
                    switch (currentElement) {
                        case "title":{
                            embedPrompt.setDescription("Digite o novo título");
                            break;
                        }
                        case "description":{
                            embedPrompt.setDescription("Digite a nova descrição");
                            break;
                        }
                        case "url":{
                            embedPrompt.setDescription("Digite a nova descrição");
                            break;
                        }
                        case "thumb":{
                            if (!newEmbed.data.thumbnail) {
                                imageEditButtons[2].setDisabled(true)
                            }
    
                            embedPrompt.setDescription("Escolha o que deseja fazer com a imagem da thumb");

                            subInteraction.update({
                                embeds: [newEmbed, embedPrompt], files, 
                                components: [DiscordTools.createRowButtons(...imageEditButtons)]
                            });
                            return;
                        }
                        case "banner":{
                            if (!newEmbed.data.image) {
                                imageEditButtons[2].setDisabled(true)
                            }
                            embedPrompt.setDescription("Escolha o que deseja fazer com a imagem do banner");

                            subInteraction.update({
                                embeds: [newEmbed, embedPrompt], files, 
                                components: [DiscordTools.createRowButtons(...imageEditButtons)]
                            });
                            return;
                        }
                    }

                    subInteraction.update({
                        embeds: [newEmbed, embedPrompt], files,
                        components: [DiscordTools.createRowButtons(backButton)]
                    });

                    currentCollector = awaitMessage(channel, interaction);
                }})

                DiscordTools.buttonCollector({source: msg, async collect(subInteraction){
                    switch (subInteraction.customId) {
                        case "resource-edit-back-button":{
                            if (currentCollector) currentCollector.stop();
                            backToMenu(subInteraction);
                            return;
                        }
                        case "resource-edit-discard-button":{
                            newEmbed = new EmbedBuilder(backupEmbed).setFooter({
                                text: "Isso é um preview do seu recurso original", 
                                iconURL: config.images.status.existing
                            })
                            .setURL(resource.acessURL);
    
                            files.length = 0;
                            
                            backToMenu(subInteraction);
                            return;
                        }
                        case "resource-edit-cancel-button":{
                            subInteraction.deferUpdate()
                            interaction.deleteReply().catch(() => {})
                            return;
                        }
                        case "resource-edit-image-change-button":{
                            switch (currentElement) {
                                case "thumb":{
                                    embedPrompt.setDescription("Envie a nova imagem para a thumbnail");
                                    break;
                                }
                                case "banner":{
                                    embedPrompt.setDescription("Envie a nova imagem para o banner");
                                    break;
                                }
                            }
    
                            await subInteraction.update({
                                embeds: [newEmbed, embedPrompt], files,
                                components: [DiscordTools.createRowButtons(backButton)]
                            });
    
                            currentCollector = awaitMessage(channel, interaction);
                            return;
                        }
                        case "resource-edit-image-remove-button":{
                            switch (currentElement) {
                                case "thumb":{
                                    newEmbed.setThumbnail(null)
                                    const currentImage = files.find(a => a.name == "thumb.png")
                                    if (currentImage) {
                                        files.splice(files.indexOf(currentImage), 1)
                                    }
                                    break;
                                }
                                case "banner":{
                                    newEmbed.setImage(null)
                                    const currentImage = files.find(a => a.name == "banner.png")
                                    if (currentImage) {
                                        files.splice(files.indexOf(currentImage), 1)
                                    }
                                    break;
                                }
                            }
    
                            backToMenu(subInteraction);
                            return;
                        }
                        case "resource-edit-save-button":{
                            subInteraction.deferUpdate()
    
                            const { title, description, url, thumbnail, image } = newEmbed.data
    
                            const rowResource = DiscordTools.createRowButtons(
                                new ButtonBuilder({url: url, label: "Acessar", style: ButtonStyle.Link}),
                                new ButtonBuilder({customId: "resource-report-button", label: "Reportar", style: ButtonStyle.Danger}),
                            );
    
                            newEmbed.setFooter(null);
    
                            resourceMsg.edit({embeds: [newEmbed], components: [rowResource], files})
                            .then(async (msg) => {
                                if (title) resource.title = title;
                                if (description) resource.description = description;
                                if (url) resource.acessURL = url;
    
                                if (!thumbnail) delete resource.thumbURL;
                                else resource.thumbURL = msg.embeds[0].thumbnail?.url;
                                
                                if (!image) delete resource.bannerURL;
                                else resource.bannerURL = msg.embeds[0].image?.url;
    
                                await db.resources.setData(id, resource);
                                //resourcesColl.saveDocData(id, resource);

                                await interaction.editReply({ embeds: [], files: [], components: [],
                                    content: `O seu recurso foi editado com sucesso! [Confira](${resource.messageURL})`
                                });
                            })
                            .catch(async (err) => {
                                await interaction.editReply({ embeds: [], files: [], components: [],
                                    content: `Não foi possível editar o recurso!
                                    ${codeBlock(err)}`
                                });
                            })
                            return;
                        }
                    }
                }});

                function awaitMessage(channel: TextChannel, interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction){
                    return DiscordCreate.messageCollector(channel, {filter: m => m.author.id == member.id}, async (message) => {

                        const { content, attachments } = message;

                        const attach = attachments.first();

                        message.delete().catch(logger);
                        
                        switch (currentElement) {
                            case "title":{
                                if (content.length > 200){
                                    interaction.followUp({ephemeral: true, content: `O título não pode ultrapassar 200 caracteres`})
                                    break;
                                }
                                newEmbed.setTitle(content)
                                break;
                            }
                            case "description":{
                                if (content.length > 3500){
                                    interaction.followUp({ephemeral: true, content: `A descrição não pode ultrapassar 3500 caracteres`})
                                    break;
                                }
                                newEmbed.setDescription(content);
                                break;
                            }
                            case "url":{
                                if (!content.includes("http://") && !content.includes("https://")) {
                                    interaction.followUp({ephemeral: true, content: "A url de acesso do recurso que você enviou não é válida!"})
                                    return;
                                }
                                newEmbed.setURL(content)
                                break;
                            }
                            case "thumb":{
                                if (!attach) {
                                    interaction.followUp({ephemeral: true, content: "É necessário enviar uma imagem!"})
                                    return;
                                }

                                const currentImage = files.find(a => a.name == "thumb.png")
                                if (currentImage) {
                                    files.splice(files.indexOf(currentImage), 1)
                                }

                                files.push(new AttachmentBuilder(attach.url, {name: "thumb.png"}))
                                newEmbed.setThumbnail("attachment://thumb.png")
                                break;
                            }
                            case "banner":{
                                if (!attach) {
                                    interaction.followUp({ephemeral: true, content: "É necessário enviar uma imagem!"})
                                    return;
                                }

                                const currentImage = files.find(a => a.name == "banner.png")
                                if (currentImage) {
                                    files.splice(files.indexOf(currentImage), 1)
                                }

                                files.push(new AttachmentBuilder(attach.url, {name: "banner.png"}))
                                newEmbed.setImage("attachment://banner.png")
                                break;
                            }
                        }

                        currentCollector.stop();
                        backToMenu(interaction);
                    })
                }
                return;
            }
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

                const msg = await interaction.reply({ephemeral: true, embeds: [
                    new EmbedBuilder()
                    .setColor(config.colors.danger as ColorResolvable)
                    .setDescription(`O recurso **${resource.title}** será deletado permanentemente!
                    Deseja mesmo deletar este recurso?`)
                ], components: [DiscordTools.createRowButtons(
                    new ButtonBuilder({customId: "resource-delete-confirm-button", label: "Confirmar", style: ButtonStyle.Success})
                )]});

                DiscordTools.buttonCollector({source: msg, async collect(subInteraction){
                    const status = await ResourceManager.delete(id, guild);

                    if (status.success) {
                        new BreakInteraction(subInteraction, `O recurso ${resource.title} foi deletado com sucesso!`, {
                            color: config.colors.success, disableFooter: true, replace: true
                        });
                    } else {
                        new BreakInteraction(subInteraction, `Não foi possível deletar o recurso!
                        Mensagem: ${codeBlock(status.message)}`, {
                            color: config.colors.danger, disableFooter: true, replace: true
                        });
                    }
                    // const cooldown = new Cooldown(1, "MINUTES");
                    // playersColl.getDocManager(member.id).set("cooldowns.commands.resources.delete", cooldown.getTime())
                }});
                return;
            }
            case "search":{
                const id = options.getString("title", true);

                const resource = await db.resources.get(id) as DocumentResource | undefined;
                if (!resource) {
                    new BreakInteraction(interaction, "O recurso não foi encontrado!");
                    return;
                }

                const embed = new EmbedBuilder({
                    description: `Ir até **${resource.title}** [clicando aqui](${resource.messageURL})`,
                    color: toHexColor(config.colors.systems.resources)
                })

                interaction.reply({ ephemeral: true, embeds: [embed] })

                return;
            }
            case "fetch": {
                const id = options.getString("id", true)

                const resource = await db.resources.get(id) as DocumentResource | undefined;
                if (!resource) {
                    new BreakInteraction(interaction, "O recurso não foi encontrado! \nTalvez o id tenha sido digitado incorretamente!");
                    return;
                }

                const embed = new EmbedBuilder({
                    description: `Ir até **${resource.title}** [clicando aqui](${resource.messageURL})`,
                    color: toHexColor(config.colors.systems.resources)
                })

                interaction.reply({ ephemeral: true, embeds: [embed] })
            }
        }
    },
    modals: new Collection([
        ["resource-upload-modal", async (interaction) => {
            const member = interaction.member as GuildMember;
            const guild = interaction.guild as Guild;
            
            await interaction.deferReply({ephemeral: true, fetchReply: true})
            
            const zunderResource = ResourceManager.tempUpload.get(member.id);
            if (!zunderResource){
                new BreakInteraction(interaction, "O recurso inicial não foi encontrado! Utilize o comando novamente!");
                return;
            }
                        
            const { thumbAttach, bannerAttach } = zunderResource
            const [ title, description, acessURL ] = [
                interaction.fields.getTextInputValue("resource-upload-title"),
                interaction.fields.getTextInputValue("resource-upload-description"),
                interaction.fields.getTextInputValue("resource-upload-acessurl"),
            ]

            const embedResource = new EmbedBuilder({ title, description, color: toHexColor(config.colors.progress.green) });

            try {
                embedResource.setURL(acessURL);
            } catch (err) {
                new BreakInteraction(interaction, "O link de acesso que você enviou não é válido!");
                return;
            }

            zunderResource.title = title;
            zunderResource.description = description;
            zunderResource.acessURL = acessURL;

            const files: Array<Attachment> = new Array();

            if (thumbAttach) {
                thumbAttach.name = "thumb.png";
                files.push(thumbAttach);
                embedResource.setThumbnail(thumbAttach.url);
            }
            if (bannerAttach){
                bannerAttach.name = "banner.png";
                files.push(bannerAttach);
                embedResource.setImage(bannerAttach.url)
            }

            const embedPrompt = new EmbedBuilder({
                description: "Selecione a categoria do seu recurso",
                color: toHexColor(config.colors.progress.red)
            });

            const rowCategorySelect = DiscordTools.createRowSelects(
                new StringSelectMenuBuilder({
                    customId: "resource-upload-category-select",
                    placeholder: "Selecionar categoria",
                    options: config.resources.categories.map(c => { 
                        return {label: c.name, description: c.description, value: c.name } 
                    })
                })
            );

            let resourceCategory = config.resources.categories[0];
            const backButton = new ButtonBuilder({
                customId: "resource-upload-back-button", 
                label: "Voltar", style: ButtonStyle.Danger
            })
            const confirmButton = new ButtonBuilder({
                customId: "resource-upload-confirm-button", 
                label: "Confirmar", style: ButtonStyle.Success
            })

            const msg = await interaction.editReply({embeds: [embedResource, embedPrompt], components: [rowCategorySelect]});

            DiscordTools.selectCollector({source: msg, async collect(subInteraction) {
                const { customId, values } = subInteraction

                if (customId == "resource-upload-category-select"){
                    resourceCategory = config.resources.categories.find(c => c.name == values[0])!;

                    const rowSubCategorySelect = DiscordTools.createRowSelects(
                        new StringSelectMenuBuilder({
                            customId: "resource-upload-subcategory-select",
                            placeholder: "Selecionar sub categoria",
                            options: resourceCategory.subCategories.map(c => { return {label: c, value: c } })
                        })
                    );

                    embedResource.setColor(config.colors.progress.yellow as ColorResolvable);
                    embedPrompt.setDescription(`> **${resourceCategory.name}/**
                    Selecione a sub categoria do recurso`)
                    .setColor(config.colors.progress.yellow as ColorResolvable);

                    subInteraction.update({
                        embeds: [embedResource, embedPrompt], 
                        components: [rowSubCategorySelect, DiscordTools.createRowButtons(backButton)]
                    })
                    return;
                }

                if (customId == "resource-upload-subcategory-select"){
                    zunderResource.category = {name: resourceCategory.name, subCategory: values[0] }
                    
                    const rowBack = DiscordTools.createRowButtons(new ButtonBuilder({
                        customId: "resource-upload-back-category-button", 
                        label: "Voltar", style: ButtonStyle.Danger
                    }))

                    embedResource.setColor(config.colors.progress.green as ColorResolvable);
                    embedPrompt.setDescription(`> **${resourceCategory.name}/${values[0]}**
                    Deseja confirmar o envio do recurso?`)
                    .setColor(config.colors.progress.green as ColorResolvable);

                    subInteraction.update({
                        embeds: [embedResource, embedPrompt], 
                        components: [DiscordTools.createRowButtons(confirmButton, backButton)]
                    })
                    return;
                }
            }})

            DiscordTools.buttonCollector({source: msg, async collect(subInteraction) {
                if (subInteraction.customId == "resource-upload-back-button"){
                    embedResource.setColor(config.colors.progress.red as ColorResolvable);
                    embedPrompt.setDescription("Selecione a categoria")
                    .setColor(config.colors.progress.red as ColorResolvable);
                    subInteraction.update({embeds: [embedResource, embedPrompt], components: [rowCategorySelect]});
                    return;
                }

                if (subInteraction.customId == "resource-upload-confirm-button"){

                    await subInteraction.deferUpdate({fetchReply: true})
                    
                    const cName = `${zunderResource.category?.name}-${zunderResource.category?.subCategory}`;
                    const channel = ServerManager.findChannel(guild, cName, ChannelType.GuildText) as TextChannel | undefined;

                    if (!channel) {
                        new BreakInteraction(interaction, "O chat para o recurso não está configurado!", {replace: true})
                        return;
                    }

                    const rowResource = DiscordTools.createRowButtons(
                        new ButtonBuilder({url: zunderResource.acessURL, label: "Acessar", style: ButtonStyle.Link}),
                        new ButtonBuilder({customId: "resource-report-button", label: "Reportar", style: ButtonStyle.Danger}),
                    )

                    embedResource.setColor(config.colors.systems.resources as ColorResolvable);

                    if (zunderResource.thumbAttach) embedResource.setThumbnail("attachment://thumb.png");
                    if (zunderResource.bannerAttach) embedResource.setImage("attachment://banner.png")
                    
                    const msg = await channel.send({embeds: [embedResource], components: [rowResource], files})

                    embedResource.setFields(
                        {name: "ID do recurso", value: msg.id, inline: true},
                        {name: "ID do autor", value: member.id, inline: true}
                    )

                    msg.edit({embeds: [embedResource]});

                    if (msg.embeds[0].thumbnail?.url) zunderResource.thumbURL = msg.embeds[0].thumbnail.url;
                    if (msg.embeds[0].image?.url) zunderResource.bannerURL = msg.embeds[0].image.url;

                    zunderResource.messageID = msg.id;
                    zunderResource.messageURL = msg.url;

                    delete zunderResource.thumbAttach
                    delete zunderResource.bannerAttach

                    await db.resources.create({id: msg.id, data: zunderResource});

                    embedPrompt.setDescription(`Seu recurso foi enviado em ${channel}! Confira [clicando aqui](${msg.url})`);
                    await interaction.editReply({embeds: [embedPrompt], components: [], files: []})

                    const role = guild.roles.cache.find(r => r.name == resourceCategory.role);
                    if (!role) return;

                    const notifyMsg = await channel.send({content: `||${role}||`})
                    await wait(20_000);
                    notifyMsg.delete().catch(logger);
                    return;
                }
            }})
        }]
    ])
})

// Command Config
type SubCommands = "upload" | "edit" | "list"| "fetch" | "search" | "delete" ;