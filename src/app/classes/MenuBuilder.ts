import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ColorResolvable, CommandInteraction, EmbedBuilder, GuildMember, InteractionResponse, Message, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextChannel, User } from "discord.js";
import { config } from "../..";
import { buttonCollector, convertHex, stringSelectCollector } from "../functions";

interface EmbedMenuItem {
    title: string;
    description: string;
    selectOption?: StringSelectMenuOptionBuilder
    color?: ColorResolvable
    thumbnail?: string
}

interface MenuBuilderOptions {
    mainEmbed?: EmbedBuilder;
    items: Array<EmbedMenuItem>;
    maxItemsPerPage: 2 | 3 | 4 | 5 | 6 | 7 | 8;
    ephemeral?: boolean;
    type?: "Grid_3" | "Grid_2" | "Grid_1" | "Blocks";
    menuFunction?: MenuFunction
}

type MenuDist = ButtonInteraction | StringSelectMenuInteraction | CommandInteraction | Message;

type MenuFunction = {placeholder: string, run:(interaction: StringSelectMenuInteraction) => any};

export class MenuBuilder {
    private mainEmbed: EmbedBuilder;
    private options;
    constructor(options:MenuBuilderOptions){
        const { mainEmbed, items, maxItemsPerPage, ephemeral = true, type = "Grid_2", menuFunction } = options;

        if (mainEmbed) this.mainEmbed = mainEmbed;
        else this.mainEmbed = new EmbedBuilder({title: "Menu", color: convertHex(config.colors.primary)});
        
        this.options = { items, maxItemsPerPage, ephemeral, type, menuFunction };
    }
    public async show(dist: MenuDist, executor: GuildMember | User, replace?: boolean){
        const { mainEmbed, options: { items, maxItemsPerPage, ephemeral, type: viewType, menuFunction } } = this;
        
        let message: Message | InteractionResponse | undefined;
        let type = viewType;

        const navBar = new ActionRowBuilder<ButtonBuilder>({components: [
            new ButtonBuilder({customId: "menu-back-button", label: "◀", style: ButtonStyle.Secondary}),
            new ButtonBuilder({customId: "menu-home-button", label: "◉", style: ButtonStyle.Secondary}),
            new ButtonBuilder({customId: "menu-next-button", label: "▶", style: ButtonStyle.Secondary}),
            new ButtonBuilder({customId: "menu-view-button", emoji: "👀", style: ButtonStyle.Primary}),
            new ButtonBuilder({customId: "menu-close-button", label: "Fechar", style: ButtonStyle.Danger})
        ]});

        let index: number = 0;
        let page: number = 0;
        let selectOptionsLenght = 0;

        const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>();
        const embeds: Array<EmbedBuilder> = [];
        
        function refreshItems(){
            mainEmbed.setFields();
            embeds.length = 0;
            selectOptionsLenght = 0;
            embeds.push(mainEmbed);

            const selectMenu = new StringSelectMenuBuilder({
                customId: "menu-select-menu", 
                placeholder: menuFunction?.placeholder || "Escolha uma opção"
            });
            
            let count = 0;

            for (let i = 0; i < maxItemsPerPage; i++) {
                index = maxItemsPerPage * page + i;
                const item = items[index];

                if (!item) {
                    if (type == "Grid_2") mainEmbed.addFields({name: "\u200b", value: "\u200b", inline: true});
                    break;
                }
                
                if (menuFunction && item.selectOption) {
                    selectMenu.addOptions(item.selectOption);
                    selectOptionsLenght++;
                }

                if (type == "Blocks") {
                    const embedItem = new EmbedBuilder()
                    .setColor(config.colors.default as ColorResolvable)
                    .setTitle(item.title)
                    .setDescription(item.description);
                    // .setFields(
                    //     { name: item.title, value: item.description, inline: true },
                    //     { name: "\u200b", value: "\u200b", inline: true},
                    //     { name: "\u200b", value: "\u200b", inline: true}
                    // );

                    if (item.thumbnail) embedItem.setThumbnail(item.thumbnail);
                    if (item.color) embedItem.setColor(item.color);

                    embeds.push(embedItem);
                }
    
                if (type == "Grid_1") {
                    mainEmbed.addFields({name: item.title, value: item.description, inline: false});
                }
                
                if (type == "Grid_2") {
                    if (count == 2){
                        mainEmbed.addFields({name: "\u200b", value: "\u200b", inline: true});
                        count = 0;
                    }
                    mainEmbed.addFields({name: item.title, value: item.description, inline: true});
                    if ((i + 1) == maxItemsPerPage){
                        mainEmbed.addFields({name: "\u200b", value: "\u200b", inline: true});
                    }
                    count++;
                }
    
                if (type == "Grid_3"){
                    mainEmbed.addFields({name: item.title, value: item.description, inline: true});
                }
            }

            rowSelect.setComponents(selectMenu);

            if (page > 0) {
                navBar.components[0].setDisabled(false);
                navBar.components[1].setDisabled(false);
            } else {
                navBar.components[0].setDisabled(true);
                navBar.components[1].setDisabled(true);
            }
    
            if (items.length > (index + 1)) {
                navBar.components[2].setDisabled(false);
            } else navBar.components[2].setDisabled(true);
        }

        refreshItems();

        const replyOptions = {
            embeds, 
            components: menuFunction && selectOptionsLenght ? [rowSelect, navBar] : [navBar],
            fetchReply: true
       };

        if (dist instanceof ButtonInteraction || dist instanceof StringSelectMenuInteraction){
            message = replace ? await dist.update(replyOptions) : await dist.reply({...replyOptions, ephemeral});
        }
        if (dist instanceof CommandInteraction){
            message = replace ? await dist.editReply(replyOptions) : await dist.reply({...replyOptions, ephemeral});
        }
        if (dist instanceof Message){
            message = await dist.reply(replyOptions);
        }

        if (!message) return;

        buttonCollector(message, {filter: b => b.user.id == executor.id}).on("collect", subInteraction => {

            if (executor.id !== subInteraction.user.id) {
                subInteraction.deferUpdate();
                return;
            }

            switch (subInteraction.customId) {
                case "menu-back-button":{
                    if (page > 0) {
                        page--;
                    }
                    break;
                }
                case "menu-home-button":{
                    if (page != 0) page = 0;
                    break;
                }
                case "menu-next-button":{
                    if (page == 0) page = 1;
                    else page++;
                    break;
                }
                case "menu-close-button":{
                    subInteraction.deferUpdate();
                    subInteraction.message.delete().catch(() => {
                        subInteraction.deleteReply().catch(() => {});
                    });
                    return;
                }
                case "menu-view-button": {
                    switch (type) {
                        case "Blocks": type = "Grid_1";
                            break;
                        case "Grid_1": type = "Grid_2";
                            break;
                        case "Grid_2": type = "Grid_3";
                            break;
                        case "Grid_3": type = "Blocks";
                            break;
                    }
                    break;
                }
            }
            
            refreshItems();
            subInteraction.update({embeds, components: menuFunction && selectOptionsLenght ? [rowSelect, navBar] : [navBar], fetchReply: true});

        });

        if (menuFunction){
            stringSelectCollector(message, { filter: s => s.user.id == executor.id })
            .on("collect", menuFunction.run);
        }
        
    }
}