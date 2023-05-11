import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, EmbedBuilder, InteractionResponse, Message, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import { DiscordCreate } from "./DiscordCreate";


type MaxItemsType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type CollunsType = 1 | 2 | 3

interface PaginatedEmbedsOptions {
    interaction: CommandInteraction, 
    embed: EmbedBuilder,  
    maxItemsPerPage: MaxItemsType,
    colluns: CollunsType,
    items: Array<{title: string, content: string, label?: string, value?: string}>
}

type Interactions = CommandInteraction | ButtonInteraction | StringSelectMenuInteraction
export interface EmbedMenuItem {
    title: string,
    content: string,
    label?: string,
    value?: string
}

type EmbedMenuExecutionFunction = (interaction: StringSelectMenuInteraction) => any;

export class EmbedMenu {
    private ephemeral?: boolean;
    private interaction: Interactions;
    private embed: EmbedBuilder;
    private maxItemsPerPage: MaxItemsType;
    private colluns: CollunsType;
    private items: Array<EmbedMenuItem> = new Array();
    private execution?: {
        placeholder: string,
        execute: EmbedMenuExecutionFunction
    };
    constructor(interaction: Interactions, embed: EmbedBuilder, maxItemsPerPage: MaxItemsType, colluns: CollunsType) {
        this.interaction = interaction;
        this.embed = embed;
        this.maxItemsPerPage = maxItemsPerPage;
        this.colluns = colluns;
    }
    public setEphemeral(ephemeral: boolean){
        this.ephemeral = ephemeral;
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
    public setExecution(placeholder: string, execute: EmbedMenuExecutionFunction){
        this.execution = { placeholder, execute };
        return this;
    }
    public async display(editReply?: boolean){

        const { ephemeral, interaction, embed, maxItemsPerPage, colluns, items, execution } = this;
        const [ execute, placeholder ] = [execution?.execute, execution?.placeholder ];

        const includeExectuion = (placeholder && execute) ? true : false;
        let index = 0;
        let page = 0;
    
        const row = new ActionRowBuilder<ButtonBuilder>({components: [
            new ButtonBuilder({customId: "back-button", label: "◄", style: ButtonStyle.Danger, disabled: true}),
            new ButtonBuilder({customId: "home-button", emoji: "🏠", style: ButtonStyle.Primary, disabled: true}),
            new ButtonBuilder({customId: "next-button", label: "►", style: ButtonStyle.Success}),
        ]});
    
        const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>({});

        function setItems(){
            embed.setFields();
            const selectMenu = new StringSelectMenuBuilder({
                customId: "embed-menu-select-menu", placeholder
            });
            
            let count = 0;
    
            for (let i = 0; i < maxItemsPerPage; i++) {
                index = maxItemsPerPage * page + i;
                const item = items[index];
    
                if (!item) {
                    if (colluns == 2) embed.addFields({name: "\u200b", value: "\u200b", inline: true});
                    break;
                }
                
                if (includeExectuion) {
                    selectMenu.addOptions(new StringSelectMenuOptionBuilder({
                        label: item.label!,
                        value: item.value!,
                    }));
                }
    
                if (colluns == 1) {
                    embed.addFields({name: item.title, value: item.content, inline: false});
                }
                
                if (colluns == 2) {
                    if (count == 2){
                        embed.addFields({name: "\u200b", value: "\u200b", inline: true});
                        count = 0;
                    }
                    embed.addFields({name: item.title, value: item.content, inline: true});
                    if (i == maxItemsPerPage - 1){
                        embed.addFields({name: "\u200b", value: "\u200b", inline: true});
                    }
                    count++;
                }
    
                if (colluns == 3){
                    embed.addFields({name: item.title, value: item.content, inline: true});
                }
            }
    
            rowSelect.setComponents(selectMenu);
    
            if (page > 0) {
                row.components[0].setDisabled(false);
                row.components[1].setDisabled(false);
            } else {
                row.components[0].setDisabled(true);
                row.components[1].setDisabled(true);
            }
    
            if (items.length > (index + 1)) {
                row.components[2].setDisabled(false);
            } else row.components[2].setDisabled(true);
        }
    
        setItems();

        const replyOptions = {
            embeds: [embed], 
            components: includeExectuion ? [rowSelect, row] : [row],
            fetchReply: true
        };
        
        let msg: Message | InteractionResponse | undefined;

        if (editReply && editReply === true) {
            msg = await interaction.editReply(replyOptions);
        } else {
            msg = await interaction.reply({...replyOptions, ephemeral});
        }

        if (!msg) return;
    
        DiscordCreate.buttonCollector(msg, async (buttonInteraction) => {
            if (interaction.user.id !== buttonInteraction.user.id) {
                buttonInteraction.deferUpdate();
                return;
            }

            switch (buttonInteraction.customId) {
                case "back-button":{
                    if (page > 0) {
                        page--;
                    }
                    break;
                }
                case "home-button":{
                    if (page != 0) page = 0;
                    break;
                }
                case "next-button":{
                    if (page == 0) page = 1;
                    else page++;
                    break;
                }
            }
            setItems();
            buttonInteraction.update({embeds: [embed], components: includeExectuion ? [rowSelect, row] : [row]});
    
        });
        if (includeExectuion) {
            DiscordCreate.selectCollector(msg, execute!);
        }
    }
}