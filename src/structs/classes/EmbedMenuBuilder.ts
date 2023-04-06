import { Interaction, TextChannel, Message, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction, AnySelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, ChannelSelectMenuInteraction, InteractionResponse, APIMessageComponentEmoji, StringSelectMenuOptionBuilder, ColorResolvable, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentEmojiResolvable, GuildMember } from "discord.js";
import { config } from "../..";
import { DiscordCreate } from "./DiscordCreate";

type EmbedMenuSendTypes = TextChannel 
| ChatInputCommandInteraction
| MessageContextMenuCommandInteraction
| UserContextMenuCommandInteraction
| AnySelectMenuInteraction
| ButtonInteraction
| ModalSubmitInteraction;

type EmbedMenuType = "BLOCK_LIST" | "GRID_1" | "GRID_2" | "GRID_3";

interface EmbedMenuOptions {
    title: string;
    maxItems: number;
    type: EmbedMenuType;
}


interface EmbedMenuItem {
    title: string;
    content: string;
    selectOption?: StringSelectMenuOptionBuilder;
    color?: ColorResolvable;
    thumb?: string;
}

type EmbedMenuFunction = (interaction: StringSelectMenuInteraction) => any;

export class EmbedMenuBuilder {
    private items: Array<EmbedMenuItem> = new Array();
    private mainEmbed = new EmbedBuilder();
    private maxItemsPerPage: number;
    private type: EmbedMenuType;
    private ephemeral: boolean = true;
    private menuFunction?: EmbedMenuFunction;
    private placeholder?: string;
    private navButtons = new ActionRowBuilder<ButtonBuilder>();

    constructor({title, maxItems, type}: EmbedMenuOptions){
        this.mainEmbed.setTitle(title);
        this.mainEmbed.setColor(config.colors.default as ColorResolvable);
        this.maxItemsPerPage = maxItems;
        this.type = type;

        this.navButtons.setComponents([
            new ButtonBuilder({customId: "embed-menu-back-button", label: "◄", style: ButtonStyle.Secondary, disabled: true}),
            new ButtonBuilder({customId: "embed-menu-home-button", emoji: "🏠", style: ButtonStyle.Secondary, disabled: true}),
            new ButtonBuilder({customId: "embed-menu-next-button", label: "►", style: ButtonStyle.Secondary}),
            new ButtonBuilder({customId: "embed-menu-view-button", emoji: "👀", style: ButtonStyle.Primary}),
            new ButtonBuilder({customId: "embed-menu-close-button", label: "Fechar", style: ButtonStyle.Danger}),
        ])
    }

    public editEmbed(embed: (embed: EmbedBuilder) => EmbedBuilder){
        embed(this.mainEmbed);
        return this;
    }

    public getEmbed(){
        return this.mainEmbed;
    }
    
    public setEphemeral(ephemeral: boolean){
        this.ephemeral = ephemeral;
        return this;
    }

    public setMenuFunction(placeholder: string, menuFunction: EmbedMenuFunction){
        this.placeholder = placeholder;
        this.menuFunction = menuFunction;
        return this;
    }

    public setItems(items: Array<EmbedMenuItem>){
        this.items = items;
        return this;
    }

    public addItem(item: EmbedMenuItem){
        this.items.push(item);
        return this;
    }

    public async send(dist: EmbedMenuSendTypes, member: GuildMember, update?: boolean){
        let msg: Message | InteractionResponse | undefined;
        
        const { ephemeral, mainEmbed, maxItemsPerPage, items, navButtons, placeholder, menuFunction } = this;
        let { type } = this;

        const includeFunction = (placeholder && menuFunction) ? true : false;
        let index: number = 0;
        let page: number = 0;

        const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>()

        let embeds: Array<EmbedBuilder> = new Array();

        function refreshItems(){
            const selectMenu = new StringSelectMenuBuilder({
                customId: "embed-menu-select-menu", placeholder
            })

            mainEmbed.setFields()

            embeds = new Array()
            embeds.push(mainEmbed)

            let count = 0;
    
            for (let i = 0; i < maxItemsPerPage; i++) {
                index = maxItemsPerPage * page + i;
                const item = items[index];
    
                if (!item) {
                    if (type == "GRID_2") mainEmbed.addFields({name: "\u200b", value: "\u200b", inline: true});
                    break;
                };
                
                if (includeFunction) {
                    if (item.selectOption) selectMenu.addOptions(item.selectOption)
                }

                if (type == "BLOCK_LIST") {

                    const embedItem = new EmbedBuilder()
                    .setColor(config.colors.default as ColorResolvable)
                    .setFields(
                        { name: item.title, value: item.content, inline: true },
                        { name: "\u200b", value: "\u200b", inline: true},
                        { name: "\u200b", value: "\u200b", inline: true}
                    )

                    if (item.thumb) embedItem.setThumbnail(item.thumb);
                    if (item.color) embedItem.setColor(item.color as ColorResolvable);

                    embeds.push(embedItem);
                }
    
                if (type == "GRID_1") {
                    mainEmbed.addFields({name: item.title, value: item.content, inline: false});
                }
                
                if (type == "GRID_2") {
                    if (count == 2){
                        mainEmbed.addFields({name: "\u200b", value: "\u200b", inline: true});
                        count = 0;
                    }
                    mainEmbed.addFields({name: item.title, value: item.content, inline: true});
                    if (i == maxItemsPerPage - 1){
                        mainEmbed.addFields({name: "\u200b", value: "\u200b", inline: true});
                    }
                    count++;
                }
    
                if (type == "GRID_3"){
                    mainEmbed.addFields({name: item.title, value: item.content, inline: true});
                }
            }
    
            rowSelect.setComponents(selectMenu)
    
            if (page > 0) {
                navButtons.components[0].setDisabled(false)
                navButtons.components[1].setDisabled(false)
            } else {
                navButtons.components[0].setDisabled(true)
                navButtons.components[1].setDisabled(true)
            }
    
            if (items.length > (index + 1)) {
                navButtons.components[2].setDisabled(false);
            } else navButtons.components[2].setDisabled(true);
        }

        refreshItems();

        const replyOptions = {
             embeds, 
             components: includeFunction ? [rowSelect, navButtons] : [navButtons],
             fetchReply: true
        }
        
        if (dist instanceof TextChannel) {
            msg = await dist.send(replyOptions);
        }

        if (dist instanceof ChatInputCommandInteraction ||
            dist instanceof UserContextMenuCommandInteraction ||
            dist instanceof MessageContextMenuCommandInteraction
        ) {
            if (update === true) {
                msg = await dist.editReply(replyOptions)
            } else {
                msg = await dist.reply({...replyOptions, ephemeral})
            }
        }


        if (dist instanceof ButtonInteraction ||
            dist instanceof StringSelectMenuInteraction ||
            dist instanceof ChannelSelectMenuInteraction
        ) {
            if (update === true) {
                msg = await dist.update(replyOptions)
            } else {
                msg = await dist.reply({...replyOptions, ephemeral})
            }
        }

        if (!msg) return;
    
        DiscordCreate.buttonCollector(msg, async (buttonInteraction) => {
            if (member.id !== buttonInteraction.user.id) {
                buttonInteraction.deferUpdate()
                return;
            }

            switch (buttonInteraction.customId) {
                case "embed-menu-back-button":{
                    if (page > 0) {
                        page--;
                    }
                    break;
                }
                case "embed-menu-home-button":{
                    if (page != 0) page = 0;
                    break;
                }
                case "embed-menu-next-button":{
                    if (page == 0) page = 1;
                    else page++;
                    break;
                }
                case "embed-menu-close-button":{
                    buttonInteraction.deferUpdate()
                    buttonInteraction.message.delete().catch(() => {
                        buttonInteraction.deleteReply().catch(() => {})
                    })
                    return;
                }
                case "embed-menu-view-button": {
                    switch (type) {
                        case "BLOCK_LIST": type = "GRID_1";
                            break;
                        case "GRID_1": type = "GRID_2"
                            break;
                        case "GRID_2": type = "GRID_3"
                            break;
                        case "GRID_3": type = "BLOCK_LIST"
                            break;
                    }
                    break;
                }
            }
            
            refreshItems()
            buttonInteraction.update({embeds, components: includeFunction ? [rowSelect, navButtons] : [navButtons], fetchReply: true})
        })

        if (includeFunction) {
            DiscordCreate.selectCollector(msg, menuFunction!)
        }

    }
}