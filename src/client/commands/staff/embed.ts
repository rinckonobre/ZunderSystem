import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, ColorResolvable, ComponentType, EmbedBuilder, EmbedData, MessageCollector, ModalBuilder, ModalSubmitInteraction, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { db, config } from "../../..";
import { Command } from "../../../app/base";
import { BreakInteraction } from "../../../app/classes";
import { convertHex, buttonCollector, messageCollector, stringSelectCollector } from "../../../app/functions";
import { DocumentPlayer } from "../../../app/interfaces";

export default new Command({
    name: "embed",
    description: "Create a embed message",
    descriptionLocalizations: { "pt-BR": "Cria uma mensagem embed" },
    visibility: "restricted",
    dmPermission: false,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "data", nameLocalizations: { "pt-BR": "dados" },
            description: "Embed data",
            descriptionLocalizations: { "pt-BR": "Dados de embed" },
            type: ApplicationCommandOptionType.String
        }
    ],
    async run(interaction) {
        const { guild, channel, member, options } = interaction;
        
        // Checks
        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData || !memberData.registry || memberData.registry.level < 3) {
            new BreakInteraction(interaction, "Apenas Mods e superiores podem utilizar este comando!");
            return;
        }

        if (channel?.type != ChannelType.GuildText) {
            new BreakInteraction(interaction, "Só é possível utilizar esse comando em chats de texto comuns!");
            return;
        }

        // Command

        await interaction.deferReply({ ephemeral: true, fetchReply: true });
        const data = options.getString("data");

        // Embed Struct
        const blankEmbedData: EmbedData = {
            title: "Título básico", description: `Descrição básica de embed 
            Dicas: 
            _*Deixe para definir imagens por último!_
            _*Separe artigos usando fields!_
            _*Formate seu texto com o markdown do discord!_
            `,
            color: convertHex(config.colors.theme.success)
        };
        let embedBuild: EmbedBuilder;
        embedBuild = new EmbedBuilder(blankEmbedData);
        try {
            if (data) embedBuild = new EmbedBuilder(JSON.parse(data));
        } catch (err) { }

        const maxEmbedSize = 5800;
        // Menu Struct

        const files: Array<AttachmentBuilder> = new Array(); 

        const modal = new ModalBuilder({ customId: "embed-input-modal", title: "Modal" });
        const inputs = {
            first: new TextInputBuilder({ customId: "embed-first-input" }),
            second: new TextInputBuilder({ customId: "embed-second-input" }),
            third: new TextInputBuilder({ customId: "embed-third-input" }),
        };

        async function getModalResponse(subInteraction: ButtonInteraction) {
            const time = 3 * 60 * 1000;
            return await subInteraction.awaitModalSubmit({ time }).catch(() => null);
        }

        async function modalIsValid(modalInteraction: ModalSubmitInteraction) {
            return await modalInteraction.deferUpdate().then(() => true).catch(() => false);
        }

        const rows = {
            first: new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>(),
            second: new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>(),
            third: new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>(),
        };

        const elementsSelect = new StringSelectMenuBuilder({
            customId: "embed-elements-select",
            placeholder: "Selecione o elemento do embed",
            options: [
                { label: "Título",      value: "title",         emoji: "✏️", description: "Alterar o título do embed" },
                { label: "Descrição",   value: "description",   emoji: "📝", description: "Alterar a descrição do embed" },
                { label: "URL",         value: "url",           emoji: "🔗", description: "Alterar a URL do embed" },
                { label: "Thumbnail",   value: "thumbnail",     emoji: "🌌", description: "Alterar a thumbnail do embed"},
                { label: "Banner",      value: "banner",        emoji: "🏞️", description: "Alterar o banner do embed"},
                { label: "Cor",         value: "color",         emoji: "💙", description: "Alterar a cor do embed" },
                { label: "Autor",       value: "author",        emoji: "👤", description: "Alterar o autor do embed" },
                { label: "Fields",      value: "fields",        emoji: "🗂️", description: "Alterar os fields do embed" },
                { label: "Footer",      value: "footer",        emoji: "📑", description: "Alterar o footer do embed" },
            ]
        });

        const buttons = {
            send:   new ButtonBuilder({ customId: "embed-send-button",      label: "Enviar",    style: ButtonStyle.Success, emoji: "✉️" }),
            close:  new ButtonBuilder({ customId: "embed-close-button",     label: "Fechar",    style: ButtonStyle.Danger   }),

            options:new ButtonBuilder({ customId: "embed-options-button",   label: "Opções",    style: ButtonStyle.Primary, emoji: "🖊️" }),
            save:   new ButtonBuilder({ customId: "embed-save-button",      label: "Salvar",    style: ButtonStyle.Success, emoji: "📑" }),
            load:   new ButtonBuilder({ customId: "embed-load-button",      label: "Carregar",  style: ButtonStyle.Primary, emoji: "📑" }),
            reset:  new ButtonBuilder({ customId: "embed-reset-button",     label: "Redefinir", style: ButtonStyle.Danger,  emoji: "🗑️" }),

            add:    new ButtonBuilder({ customId: "embed-add-button",       label: "Adicionar", style: ButtonStyle.Success  }),
            change: new ButtonBuilder({ customId: "embed-change-button",    label: "Alterar",   style: ButtonStyle.Primary  }),
            toggle: new ButtonBuilder({ customId: "embed-toggle-button",    label: "Alternar",  style: ButtonStyle.Primary  }),
            remove: new ButtonBuilder({ customId: "embed-remove-button",    label: "Remover",   style: ButtonStyle.Danger   }),

            back:   new ButtonBuilder({ customId: "embed-back-button",      label: "Voltar",    style: ButtonStyle.Danger   }),
            confirm:new ButtonBuilder({ customId: "embed-confirm-button",   label: "Confirmar", style: ButtonStyle.Success  })
        };

        const embedDisplay = new EmbedBuilder({
            color: convertHex(config.colors.theme.default), description: "Selecione um elemento"
        });

        interface EmbedCreatorCurrents { 
            element: EmbedSection, index: number, messageCollector: MessageCollector | undefined 
        }
        const currents: EmbedCreatorCurrents = {
            element: "title", index: 0, messageCollector: undefined
        };

        function getEmbedSize(){
            const { title, description, author, footer, fields } = embedBuild.data;

            let totalLenght = 0;

            if (title) totalLenght += title.length;
            if (description) totalLenght += description.length;
            if (author) totalLenght += author.name.length;
            if (footer) totalLenght += footer.text.length;
            if (fields && fields.length > 0) for (const field of fields){
                const { name, value } = field;
                totalLenght += name.length;
                totalLenght += value.length;
            }
            return totalLenght;
        }

        function getMainMenu() {
            return {
                embeds: [embedBuild, embedDisplay], components: [
                    rows.first.setComponents(elementsSelect),
                    rows.second.setComponents(buttons.send, buttons.options, buttons.close)
                ], files
            };
        }

        function getFieldsMenu() {
            const { fields } = embedBuild.data;
            buttons.remove.setDisabled(false);

            if (fields && fields.length > 0) {
                const fieldsSelect = new StringSelectMenuBuilder({
                    customId: "embed-fields-select",
                    options: fields.map((f, index) => ({ label: `(${index}) ${f.name}`, value: String(index), emoji: "🗂️" }))
                });
                rows.first.setComponents(fieldsSelect);
                rows.second.setComponents(buttons.add, buttons.remove, buttons.back);
                return { embeds: [embedBuild, embedDisplay], components: [rows.first, rows.second] };
            } else {
                buttons.remove.setDisabled(true);
                rows.first.setComponents(buttons.add, buttons.remove, buttons.back);
                return { embeds: [embedBuild, embedDisplay], components: [rows.first], files };
            }
        }

        function getFieldMenu(){
            embedDisplay.setDescription(`Escolha como deseja controlar o field **(${currents.index})**`); 
            const { fields } = embedBuild.data;
            if (fields && fields.length > 0){
                if (fields[currents.index].inline) buttons.toggle.setStyle(ButtonStyle.Primary);
                else buttons.toggle.setStyle(ButtonStyle.Secondary);
            }
            buttons.toggle.setLabel("Em linha");
            rows.first.setComponents(buttons.change, buttons.remove, buttons.toggle, buttons.back);
            return {embeds: [embedBuild, embedDisplay], components: [rows.first], files};
        }

        function getOptionsMenu(){
            embedDisplay.setColor(convertHex(config.colors.theme.default))
            .setDescription("Escolha o que deseja fazer");
            rows.first.setComponents(buttons.save, buttons.load, buttons.reset, buttons.back);
            return { embeds: [embedBuild, embedDisplay], components: [rows.first], files };
        }

        function getElementMenu(noEditDisplay: boolean = false) {
            rows.first.setComponents(buttons.change, buttons.remove, buttons.back);
            const { title, description, color, url, author, footer, fields, thumbnail, image } = embedBuild.data;

            buttons.remove.setDisabled(false);

            let text = "Escolha como deseja controlar ";

            switch (currents.element) {
                case "title": {
                    if (!title) buttons.remove.setDisabled(true);
                    if (title && !description) buttons.remove.setDisabled(true);
                    text += "o título";
                    break;
                }
                case "description": {
                    if (!description) buttons.remove.setDisabled(true);
                    if (description && !title) buttons.remove.setDisabled(true);
                    text += "a descrição";
                    break;
                }
                case "color": {
                    if (!color) buttons.remove.setDisabled(true);
                    text += "a cor";
                    break;
                }
                case "url": {
                    if (!url) buttons.remove.setDisabled(true);
                    text += "a url";
                    break;
                }
                case "author": {
                    if (!author) buttons.remove.setDisabled(true);
                    text += "o autor";
                    break;
                }
                case "footer": {
                    if (!footer) buttons.remove.setDisabled(true);
                    text += "o footer";
                    break;
                }
                case "fields": {
                    text += "os fields";
                    return getFieldsMenu();
                }
                case "field": {
                    const field = fields!.at(currents.index);
                    if (field?.inline) buttons.toggle.setStyle(ButtonStyle.Primary);
                    else buttons.toggle.setStyle(ButtonStyle.Secondary);
                    rows.first.setComponents(buttons.change, buttons.remove, buttons.toggle, buttons.back);
                    text += `o field **(${currents.index})**`;
                    break;
                }
                case "thumbnail": {
                    if (!thumbnail) buttons.remove.setDisabled(true);
                    text += "a thumbnail";
                    break;
                }
                case "banner": {
                    if (!image) buttons.remove.setDisabled(true);
                    text += "o banner";
                    break;
                }
            }
            if (!noEditDisplay) embedDisplay.setColor(convertHex(config.colors.theme.default)).setDescription(text);
            return { embeds: [embedBuild, embedDisplay], components: [rows.first], files };
        }
        
        const message = await interaction.editReply(getMainMenu());

        buttonCollector(message).on("collect", async (subInteraction) => {
            switch (subInteraction.customId) {
                case "embed-back-button": {
                    currents.messageCollector?.stop();
                    switch (currents.element) {
                        case "field": {
                            currents.element = "fields";
                            embedDisplay.setColor(convertHex(config.colors.theme.default))
                            .setDescription("Escolha como deseja controlar os fields");
                            subInteraction.update(getFieldsMenu());
                            break;
                        }
                        default: {
                            embedDisplay.setColor(convertHex(config.colors.theme.default))
                            .setDescription("Selecione um elemento");
                            subInteraction.update(getMainMenu());
                        }
                    }
                    return;
                }
                case "embed-add-button": {
                    const { fields } = embedBuild.data;
                    switch (currents.element) {
                        case "fields": {
                            inputs.first.setLabel("Nome").setPlaceholder("Digite o nome do field")
                                .setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(256).setValue("");

                            inputs.second.setLabel("Valor").setPlaceholder("Digite o valor do field")
                                .setRequired(true).setStyle(TextInputStyle.Paragraph).setMaxLength(1024).setValue("");

                            modal.setTitle("Adicionar field").setComponents(
                                new ActionRowBuilder<TextInputBuilder>({ components: [inputs.first] }),
                                new ActionRowBuilder<TextInputBuilder>({ components: [inputs.second] })
                            );

                            subInteraction.showModal(modal);
                            const modalInteraction = await getModalResponse(subInteraction);
                            if (modalInteraction && currents.element == "fields") {
                                if (!await modalIsValid(modalInteraction)) return;
                                const name = modalInteraction.fields.getTextInputValue("embed-first-input");
                                const value = modalInteraction.fields.getTextInputValue("embed-second-input");
                                
                                const fieldLenth = (name.length + value.length);
                                if (getEmbedSize() + fieldLenth >= maxEmbedSize){
                                    const info = `Tamanho atual do embed: (${getEmbedSize()} / ${maxEmbedSize}) \nTamanho do field atual: ${fieldLenth}`;
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription(`O total de caracteres desse embed será atingido com este field! \n${info}`);
                                    await interaction.editReply(getFieldsMenu());
                                    return;
                                }

                                try {
                                    embedBuild.addFields({ name, value });
                                    embedDisplay.setColor(convertHex(config.colors.theme.success))
                                    .setDescription("Field adicionado!");
                                    await interaction.editReply(getFieldsMenu());
                                } catch (err) {
                                    if (fields && fields.length > 1) {
                                        fields.pop();
                                    } else {
                                        embedBuild.setFields();
                                    }
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription("Não foi possível adicionar o field ao embed!");
                                    await interaction.editReply(getFieldsMenu());
                                }
                            }
                            return;
                        }
                    }
                    return;
                }
                case "embed-change-button": {
                    const { title, description, color, url, author, footer, fields } = embedBuild.data;
                    let modalInteraction: ModalSubmitInteraction | null = null;
                    let noEditDisplay = false;
                    switch (currents.element) {
                        case "title": {
                            inputs.first.setLabel("Título").setMaxLength(256).setStyle(TextInputStyle.Short)
                            .setPlaceholder("Digite o título do embed");
                            if (title) inputs.first.setValue(title); else inputs.first.setValue("");

                            modal.setTitle("Editar título")
                            .setComponents(new ActionRowBuilder({ components: [inputs.first] }));
                            await subInteraction.showModal(modal);

                            modalInteraction = await getModalResponse(subInteraction);
                            if (modalInteraction && currents.element == "title") {
                                if (!await modalIsValid(modalInteraction)) break;
                                const newTitle = modalInteraction.fields.getTextInputValue("embed-first-input");

                                if ((getEmbedSize() - (title?.length || 0)) + newTitle.length >= maxEmbedSize){
                                    const info = `Tamanho atual do embed: (${getEmbedSize()} / ${maxEmbedSize}) \nTamanho do field atual: ${newTitle.length}`;
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription(`O total de caracteres desse embed será atingido com este título! \n${info}`);
                                    noEditDisplay = true;
                                    break;
                                }
                                embedBuild.setTitle(newTitle);
                            }
                            break;
                        }
                        case "description": {
                            inputs.first.setLabel("Descrição").setMaxLength(4000).setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder("Digite a descrição do embed");
                            if (description) inputs.first.setValue(description); else inputs.first.setValue("");

                            modal.setTitle("Editar descrição")
                            .setComponents(new ActionRowBuilder({ components: [inputs.first] }));
                            await subInteraction.showModal(modal);

                            modalInteraction = await getModalResponse(subInteraction);
                            if (modalInteraction && currents.element == "description") {
                                if (!await modalIsValid(modalInteraction)) break;
                                const newDescription = modalInteraction.fields.getTextInputValue("embed-first-input");
                                
                                if ((getEmbedSize() - (description?.length || 0)) + newDescription.length >= maxEmbedSize){
                                    const info = `Tamanho atual do embed: (${getEmbedSize()} / ${maxEmbedSize}) \nTamanho da descrição: ${newDescription.length}`;
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription(`O total de caracteres desse embed será atingido com esta descrição! \n${info}`);
                                    noEditDisplay = true;
                                    break;
                                }
                                embedBuild.setDescription(newDescription);
                            }
                            break;
                        }
                        case "color": {
                            inputs.first.setLabel("Cor").setMaxLength(10).setStyle(TextInputStyle.Short)
                            .setPlaceholder("Insira a cor do embed. Ex: #32a852");
                            if (color) inputs.first.setValue(String(color)); else inputs.first.setValue("");

                            modal.setTitle("Editar cor")
                            .setComponents(new ActionRowBuilder({ components: [inputs.first] }));
                            await subInteraction.showModal(modal);

                            modalInteraction = await getModalResponse(subInteraction);
                            if (modalInteraction && currents.element == "color") {
                                if (!await modalIsValid(modalInteraction)) break;
                                const color = modalInteraction.fields.getTextInputValue("embed-first-input");
                                try {
                                    embedBuild.setColor(color as ColorResolvable);
                                } catch (err) {
                                    embedDisplay.setDescription("Não foi possível definir a cor especificada!")
                                        .setColor(convertHex(config.colors.theme.danger));
                                    noEditDisplay = true;
                                }
                            }
                            break;
                        }
                        case "url": {
                            inputs.first.setLabel("Url").setMaxLength(4000).setStyle(TextInputStyle.Short)
                            .setPlaceholder("Insira uma url para embed");
                            if (url) inputs.first.setValue(url); else inputs.first.setValue("");

                            modal.setTitle("Editar url")
                            .setComponents(new ActionRowBuilder({ components: [inputs.first] }));
                            await subInteraction.showModal(modal);

                            modalInteraction = await getModalResponse(subInteraction);
                            if (modalInteraction && currents.element == "url") {
                                if (!await modalIsValid(modalInteraction)) break;
                                const url = modalInteraction.fields.getTextInputValue("embed-first-input");
                                try {
                                    embedBuild.setURL(url);
                                } catch (err) {
                                    embedDisplay.setDescription("Não foi possível definir a url especificada!")
                                    .setColor(convertHex(config.colors.theme.danger));
                                    noEditDisplay = true;
                                }
                            }
                            break;
                        }
                        case "author": {
                            inputs.first.setLabel("Nome").setPlaceholder("Digite o nome do autor")
                            .setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(256).setValue("");
                            if (author?.name) inputs.first.setValue(author.name);

                            inputs.second.setLabel("Ícone").setPlaceholder("Digite a url do ícone")
                            .setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(4000).setValue("");
                            if (author?.icon_url) inputs.second.setValue(author.icon_url);

                            inputs.third.setLabel("Link").setPlaceholder("Digite o url do link")
                            .setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(4000).setValue("");
                            if (author?.url) inputs.third.setValue(author.url);

                            modal.setTitle("Editar autor")
                            .setComponents(
                                new ActionRowBuilder<TextInputBuilder>({ components: [inputs.first] }),
                                new ActionRowBuilder<TextInputBuilder>({ components: [inputs.second] }),
                                new ActionRowBuilder<TextInputBuilder>({ components: [inputs.third] })
                            );

                            subInteraction.showModal(modal);
                            modalInteraction = await getModalResponse(subInteraction);
                            if (modalInteraction && currents.element == "author") {
                                if (!await modalIsValid(modalInteraction)) break;
                                const name = modalInteraction.fields.getTextInputValue("embed-first-input");
                                const iconURL = modalInteraction.fields.getTextInputValue("embed-second-input") || undefined;
                                const url = modalInteraction.fields.getTextInputValue("embed-third-input") || undefined;
                                
                                if ((getEmbedSize() - (author?.name.length || 0)) + name.length >= maxEmbedSize){
                                    const info = `Tamanho atual do embed: (${getEmbedSize()} / ${maxEmbedSize}) \nTamanho do nome do autor: ${name.length}`;
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription(`O total de caracteres desse embed será atingido com este autor! \n${info}`);
                                    noEditDisplay = true;
                                    break;
                                }
                                try {
                                    embedBuild.setAuthor({ name: name, iconURL, url });
                                } catch (err) {
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription("Não foi possível editar o autor");
                                    noEditDisplay = true;
                                }
                            }
                            break;
                        }
                        case "footer": {
                            inputs.first.setLabel("Texto").setPlaceholder("Digite o texto do footer")
                            .setRequired(true).setMaxLength(2000).setStyle(TextInputStyle.Short).setValue("");
                            if (footer?.text) inputs.first.setValue(footer.text);

                            inputs.second.setLabel("Ícone").setPlaceholder("Digite a url do ícone")
                            .setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(4000).setValue("");
                            if (footer?.icon_url) inputs.second.setValue(footer.icon_url);

                            modal.setTitle("Editar autor")
                                .setComponents(
                                    new ActionRowBuilder<TextInputBuilder>({ components: [inputs.first] }),
                                    new ActionRowBuilder<TextInputBuilder>({ components: [inputs.second] }),
                                );

                            subInteraction.showModal(modal);
                            modalInteraction = await getModalResponse(subInteraction);
                            if (modalInteraction && currents.element == "footer") {
                                if (!await modalIsValid(modalInteraction)) break;
                                const text = modalInteraction.fields.getTextInputValue("embed-first-input");
                                const iconURL = modalInteraction.fields.getTextInputValue("embed-second-input") || undefined;
                                
                                if ((getEmbedSize() - (footer?.text.length || 0)) + text.length >= maxEmbedSize){
                                    const info = `Tamanho atual do embed: (${getEmbedSize()} / ${maxEmbedSize}) \nTamanho do texto do footer: ${text.length}`;
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription(`O total de caracteres desse embed será atingido com este footer! \n${info}`);
                                    noEditDisplay = true;
                                    break;
                                }
                                
                                try {
                                    embedBuild.setFooter({ text, iconURL });
                                } catch (err) {
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription("Não foi possível editar o autor");
                                    noEditDisplay = true;
                                }
                            }
                            break;
                        }
                        case "field": {
                            if (!fields) break;
                            const field = fields[currents.index];
                            inputs.first.setLabel("Nome").setPlaceholder("Digite o nome do field")
                            .setRequired(true).setMaxLength(256).setStyle(TextInputStyle.Short).setValue(field.name);

                            inputs.second.setLabel("Ícone").setPlaceholder("Digite o valor do field")
                            .setRequired(false).setStyle(TextInputStyle.Paragraph).setMaxLength(1024).setValue(field.value);

                            modal.setTitle("Editar field").setComponents(
                                new ActionRowBuilder<TextInputBuilder>({ components: [inputs.first] }),
                                new ActionRowBuilder<TextInputBuilder>({ components: [inputs.second] }),
                            );

                            subInteraction.showModal(modal);
                            modalInteraction = await getModalResponse(subInteraction);
                            if (modalInteraction && currents.element == "field") {
                                if (!await modalIsValid(modalInteraction)) break;
                                const name = modalInteraction.fields.getTextInputValue("embed-first-input");
                                const value = modalInteraction.fields.getTextInputValue("embed-second-input");
                                
                                const field = fields.at(currents.index);
                                const currentFieldLenth = (field) ? (field.name.length + field.value.length) : 0;
                                const newFieldLenth = (name.length + value.length);

                                if ((getEmbedSize() - currentFieldLenth) + newFieldLenth >= maxEmbedSize){
                                    const info = `Tamanho atual do embed: (${getEmbedSize()} / ${maxEmbedSize}) \nTamanho do field atual: ${newFieldLenth}`;
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription(`O total de caracteres desse embed será atingido com este field! \n${info}`);
                                    noEditDisplay = true;
                                    break;
                                }

                                try {
                                    embedBuild.spliceFields(currents.index, 1, { name, value });
                                } catch (err) {
                                    embedDisplay.setColor(convertHex(config.colors.theme.danger))
                                    .setDescription("Não foi possível editar o field do embed!");
                                    noEditDisplay = true;
                                }
                            }
                            break;
                        }
                        case "thumbnail":{
                            embedDisplay.setDescription("Envie a imagem para a thumbnail no chat!");
                            subInteraction.update({ embeds: [embedBuild, embedDisplay], components: [
                                rows.first.setComponents(buttons.back)
                            ]});

                            currents.messageCollector = messageCollector(channel, {filter: m => m.author.id == member.id})
                            .on("collect", message => {
                                const { attachments } = message;
                                message.delete().catch(() => {});
                                const attach = attachments.first();

                                console.log(attach?.contentType);

                                if (!attach || attach.contentType !== "image/png"){
                                    embedDisplay.setDescription("Envie pelo menos uma imagem para a thumbnail")
                                    .setColor(convertHex(config.colors.theme.danger));
                                    subInteraction.editReply({ embeds: [embedBuild, embedDisplay] });
                                    return;
                                }

                                currents.messageCollector?.stop();

                                const index = files.findIndex(a => a.name === "thumbnail.png");
                                if (index !== -1) {
                                    files.splice(index, 1);
                                }

                                files.push(new AttachmentBuilder(attach.url, {name: "thumbnail.png"}));
                                embedBuild.setThumbnail("attachment://thumbnail.png");
                                subInteraction.editReply(getElementMenu(true));
                            });
                            return;
                        }
                        case "banner":{
                            embedDisplay.setDescription("Envie a imagem para o banner no chat!");
                            subInteraction.update({ embeds: [embedBuild, embedDisplay], components: [
                                rows.first.setComponents(buttons.back)
                            ]});

                            currents.messageCollector = messageCollector(channel, {filter: m => m.author.id == member.id})
                            .on("collect", message => {
                                const { attachments } = message;
                                message.delete().catch(() => {});
                                const attach = attachments.first();

                                if (!attach){
                                    embedDisplay.setDescription("Envie pelo menos uma imagem para o banner")
                                    .setColor(convertHex(config.colors.theme.danger));
                                    subInteraction.editReply({ embeds: [embedBuild, embedDisplay] });
                                    return;
                                }

                                currents.messageCollector?.stop();

                                const index = files.findIndex(a => a.name === "banner.png");
                                if (index !== -1) {
                                    files.splice(index, 1);
                                }

                                files.push(new AttachmentBuilder(attach.url, {name: "banner.png"}));
                                embedBuild.setImage("attachment://banner.png");
                                subInteraction.editReply(getElementMenu(true));
                            });
                            return;
                        }
                    }
                    interaction.editReply(getElementMenu(noEditDisplay));
                    return;
                }
                case "embed-remove-button": {
                    const { fields } = embedBuild.data;
                    switch (currents.element) {
                        case "title": embedBuild.setTitle(null);
                            break;
                        case "description": embedBuild.setDescription(null);
                            break;
                        case "color": embedBuild.setColor(null);
                            break;
                        case "url": embedBuild.setURL(null);
                            break;
                        case "author": embedBuild.setAuthor(null);
                            break;
                        case "footer": embedBuild.setFooter(null);
                            break;
                        case "fields": {
                            if (fields) {
                                if (fields.length > 1) {
                                    embedBuild.spliceFields(fields.length - 1, 1);
                                } else {
                                    embedBuild.setFields();
                                }
                            }
                            subInteraction.update(getFieldsMenu());
                            return;
                        }
                        case "field": {
                            embedDisplay.setDescription("Escolha como deseja controlar os fields");
                            currents.element = "fields";
                            embedBuild.spliceFields(currents.index, 1);
                            subInteraction.update(getFieldsMenu());
                            return;
                        }
                        case "thumbnail":{
                            const index = files.findIndex(a => a.name === "thumbnail.png");
                            if (index !== -1) {
                                files.splice(index, 1);
                            }
                            embedBuild.setThumbnail(null);
                            break;
                        }
                        case "banner":{
                            const index = files.findIndex(a => a.name === "banner.png");
                            if (index !== -1) {
                                files.splice(index, 1);
                            }
                            embedBuild.setImage(null);
                            break;
                        }
                    }
                    subInteraction.update(getElementMenu());
                    return;
                }
                case "embed-toggle-button":{
                    switch (currents.element) {
                        case "field": {
                            const { fields } = embedBuild.data;
                            if (fields && fields.length > 0){
                                fields[currents.index].inline = !fields[currents.index].inline;  
                            }
                            subInteraction.update(getFieldMenu());
                            return;
                        }
                    }
                    return;
                }
                case "embed-options-button": {
                    subInteraction.update(getOptionsMenu());
                    return;
                }
                case "embed-save-button":{
                    // MemberSaves.EmbedEdit.set(member.id, new EmbedBuilder(embedBuild.data));
                    // const data = JSON.stringify(embedBuild, null, 2);
                    // subInteraction.reply({
                    //     ephemeral: true, files: [new AttachmentBuilder(Buffer.from(data, "utf-8"), {name: "embed.json"})]
                    // });
                    // embedDisplay.setColor(convertHex(config.colors.theme.success))
                    // .setDescription("O embed foi salvo!");
                    // interaction.editReply({embeds: [embedBuild, embedDisplay]});
                    return;
                }
                case "embed-load-button":{
                    // const embedLoaded = MemberSaves.EmbedEdit.get(member.id);
                    // if (!embedLoaded){
                    //     embedDisplay.setColor(convertHex(config.colors.theme.danger))
                    //     .setDescription("Não foi encontrado nenhum embed salvo!");
                    //     subInteraction.update({embeds: [embedBuild, embedDisplay]});
                    //     return;
                    // }
                    
                    // embedDisplay.setDescription("Você tem certeza que deseja carregar este embed?");
                    // rows.first.setComponents(buttons.confirm, buttons.back);
                    // const message = await subInteraction.update({embeds: [embedLoaded, embedDisplay], components: [rows.first]});
                    // const buttonInteraction = await message.awaitMessageComponent({componentType: ComponentType.Button}).catch(() => null);
                    // if (buttonInteraction && buttonInteraction.customId == "embed-confirm-button"){
                    //     embedBuild = new EmbedBuilder(embedLoaded.data);
                    //     buttonInteraction.update(getOptionsMenu());
                    // }
                    return;
                }
                case "embed-reset-button":{
                    embedBuild = new EmbedBuilder({title: "reset"});
                    embedBuild = new EmbedBuilder(blankEmbedData);
                    files.length = 0;
                    subInteraction.update(getOptionsMenu());
                    return;
                }
                case "embed-send-button":{
                    subInteraction.deferUpdate();
                    const webhooks = await guild.fetchWebhooks();
                    const webhooksMessages = webhooks.filter(w => w.name == "Zunder Mensagens");

                    if (webhooksMessages.size < 1){
                        embedDisplay.setColor(convertHex(config.colors.theme.danger))
                        .setDescription("Nenhum webhook de mensagens encontrado!");
                        interaction.editReply(getMainMenu());
                        return;
                    }

                    const webhooksSelect = new StringSelectMenuBuilder({
                        customId: "embed-send-wehbooks-select", options: webhooksMessages
                        .map(w => ({label: `${w.channel?.name}`, value: w.id, description: `Enviar embed em ${w.channel?.name}`}))
                    });

                    embedDisplay.setColor(convertHex(config.colors.theme.success))
                    .setDescription("Selecione um chat para enviar!");

                    rows.first.setComponents(webhooksSelect);
                    rows.second.setComponents(buttons.back);
                    interaction.editReply({embeds: [embedBuild, embedDisplay], components: [rows.first, rows.second]});
                    return;
                }
                case "embed-close-button":{
                    interaction.deleteReply().catch(() => {});
                    return;
                }
            }
        });

        stringSelectCollector(message).on("collect", async (subInteraction) => {
            switch (subInteraction.customId) {
                case "embed-elements-select": {
                    currents.element = subInteraction.values[0] as EmbedSection;
                    subInteraction.update(getElementMenu());
                    return;
                }
                case "embed-fields-select":{
                    currents.index = parseInt(subInteraction.values[0]);
                    currents.element = "field";
                    embedDisplay.setDescription(`Escolha como deseja controlar o field **${currents.index}**`);
                    
                    const { fields } = embedBuild.data;
                    if (fields && fields.length > 0){
                        if (fields[currents.index].inline) buttons.toggle.setStyle(ButtonStyle.Primary);
                        else buttons.toggle.setStyle(ButtonStyle.Secondary);
                    }

                    buttons.toggle.setLabel("Em linha");

                    rows.first.setComponents(buttons.change, buttons.remove, buttons.toggle, buttons.back);
                    subInteraction.update(getFieldMenu());
                    return;
                }
                case "embed-send-wehbooks-select":{
                    subInteraction.deferUpdate();
                    const webhooks = await guild.fetchWebhooks();
                    const webhook = webhooks.get(subInteraction.values[0]);

                    if (!webhook){
                        embedDisplay.setColor(convertHex(config.colors.theme.danger))
                        .setDescription("Webhook não encontrado!");
                        interaction.editReply(getMainMenu());
                        return;
                    }

                    webhook.send({embeds: [embedBuild], files})
                    .then((msg) => {
                        embedDisplay.setColor(convertHex(config.colors.theme.success))
                        .setDescription(`Sua mensagem embed foi enviada no chat ${msg.channel}! [Confira](${msg.url})`);
                        interaction.editReply(getMainMenu());
                    })
                    .catch(() => {
                        embedDisplay.setColor(convertHex(config.colors.theme.danger))
                        .setDescription("Não foi possível enviar a mensagem para o webhook!");
                        interaction.editReply(getMainMenu());
                    });
                    return;
                }
            }
        });
    }
});

// Command config
type EmbedSection = "title" | "description" | "color" |
    "thumbnail" | "url" | "banner" | "author" | "fields" | "field" | "footer";