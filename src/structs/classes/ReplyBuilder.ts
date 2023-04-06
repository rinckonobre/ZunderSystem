import { ButtonBuilder, EmbedBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonInteraction, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, CommandInteraction, InteractionReplyOptions, InteractionResponse, Message, MessageContextMenuCommandInteraction, MessageReplyOptions, ModalSubmitInteraction, ReplyOptions, StringSelectMenuBuilder, StringSelectMenuInteraction, UserContextMenuCommandInteraction } from "discord.js";
import { DiscordCreate } from "./DiscordCreate";

type ReplyBuilderInteraction = Message 
| UserContextMenuCommandInteraction
| MessageContextMenuCommandInteraction
| CommandInteraction 
| ButtonInteraction 
| StringSelectMenuInteraction 
| ModalSubmitInteraction

type ReplyBuilderSelects = StringSelectMenuBuilder | ChannelSelectMenuBuilder

export class ReplyBuilder {
    private interaction: ReplyBuilderInteraction;
    private ephemeral?: boolean;
    private content?: string;
    private files?: Array<any> = new Array();
    private components: Map<number, Array<ButtonBuilder | ReplyBuilderSelects>> = new Map();
    private buttonFunction?: (buttonInteraction: ButtonInteraction) => any;
    private selectFunction?: (selectInteraction: StringSelectMenuInteraction) => any;
    private embeds: Array<EmbedBuilder> = new Array();
    constructor(interaction: ReplyBuilderInteraction, ephemeral?: boolean){
        this.interaction = interaction
        this.ephemeral = ephemeral;
    }
    public setFiles(files: Array<any>){
        this.files = files;
        return this;
    }
    public addFile(file: any){
        this.files?.push(file)
    }
    public setContent(content: string){
        this.content = content;
        return this;
    }
    public setEmbeds(embeds: Array<EmbedBuilder>){
        this.embeds = embeds;
        return this;
    }
    public addEmbed(embed: EmbedBuilder){
        this.embeds.push(embed);
        return this;
    }
    public setSelects(row: number, selects: Array<ReplyBuilderSelects>){
        this.components.set(row, selects)
        return this;
    }
    public addSelect(row: number, select: ReplyBuilderSelects){
        const columnSelects = this.components.get(row);
        if (columnSelects) {
            this.components.set(row, [...columnSelects, select]);
        } else {
            this.components.set(row, [select]);
        }
        return this;
    }
    public setButtons(row: number, buttons: Array<ButtonBuilder>){
        this.components.set(row, buttons)
        return this;
    }
    public addButton(row: number, button: ButtonBuilder){
        const columnButtons = this.components.get(row);
        if (columnButtons) {
            this.components.set(row, [...columnButtons, button]);
        } else {
            this.components.set(row, [button]);
        }
        return this;
    }
    public setButtonFunction(func: (buttonInteraction: ButtonInteraction) => any){
        this.buttonFunction = func;
        return this;
    }
    public setSelectFunction(func: (selectInteraction: StringSelectMenuInteraction) => any){
        this.selectFunction = func;
        return this;
    }
    public async send(update?: boolean){
        const { interaction, ephemeral, content, files } = this;
        // can't be ephemeral
        const rows: Array<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>> = new Array();
        for (let i = 0; i < 5; i++) {
            const components = this.components.get(i)
            if (!components) break
            if (components[0] instanceof StringSelectMenuBuilder) {
                rows.push(new ActionRowBuilder<StringSelectMenuBuilder>({components: components }))
            }
            if (components[0] instanceof ButtonBuilder) {
                rows.push(new ActionRowBuilder<ButtonBuilder>({components: components }))
            }
        }

        const replyOptions = {content, embeds: this.embeds, components: rows, files, fetchReply: true};
        let msg: Message | InteractionResponse | undefined;

        if (interaction instanceof Message) {
            msg = await interaction.reply({...replyOptions})
        }
        // can be updated
        if (interaction instanceof ButtonInteraction || 
            interaction instanceof StringSelectMenuInteraction){

            if (update && update === true) {
                msg = await interaction.update({...replyOptions})
            } else {
                msg = await interaction.reply({ephemeral, ...replyOptions})
            }
        }

        // can be ephemeral & can't be updated 
        if (interaction instanceof CommandInteraction ||
            interaction instanceof UserContextMenuCommandInteraction ||
            interaction instanceof MessageContextMenuCommandInteraction ||
            interaction instanceof ModalSubmitInteraction){

            if (update && update === true) {
                msg = await interaction.editReply({...replyOptions})
            } else {
                msg = await interaction.reply({ephemeral, ...replyOptions})
            }
        }

        if (msg) {
           if (this.buttonFunction) DiscordCreate.buttonCollector(msg, this.buttonFunction)
           if (this.selectFunction) DiscordCreate.selectCollector(msg, this.selectFunction)
        }

        return msg;
    }

}