import { ButtonInteraction, ColorResolvable, CommandInteraction, InteractionResponse, Message, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextChannel } from "discord.js";

interface EmbedMenuItem {
    title: string;
    description: string;
    selectOption?: StringSelectMenuOptionBuilder
    color?: ColorResolvable
    thumbnail?: string
    filterArg?: string
}

interface EmbedMenuBuilderOptions {
    mainEmbed?: EmbedMenuBuilder;
    items: Array<EmbedMenuItem>;
    maxItemsPerPage: 2 | 3 | 4 | 5 | 6 | 7 | 8;
    instant?: boolean
    filters?: Array<string>
}

interface EmbedMenuShowOptions {
    replace?: boolean,
    dist: ButtonInteraction | StringSelectMenuInteraction | CommandInteraction | Message
}

export class EmbedMenuBuilder {
    constructor(options:EmbedMenuBuilderOptions){
        const { mainEmbed, items, maxItemsPerPage, instant } = options;
    }
    public async show({replace, dist}: EmbedMenuShowOptions){
        let message: Message | InteractionResponse | undefined;
        
        if (dist instanceof ButtonInteraction || dist instanceof StringSelectMenuInteraction){
            message = replace ? await dist.update({content: ""}) : await dist.reply({content: "test"});
        }
        if (dist instanceof CommandInteraction){
            message = replace ? await dist.editReply({content: ""}) : await dist.reply({content: "test"});
        }
        if (dist instanceof Message){
            message = await dist.reply({content: "test"});
        }
        
    }
}