import { ActionRowBuilder, EmbedData, MessageComponentCollectorOptions, ButtonBuilder, ButtonInteraction, ComponentType, InteractionResponse, Message, StringSelectMenuBuilder, StringSelectMenuInteraction, Collection, ColorResolvable, EmbedBuilder } from "discord.js";

type CollectorSource = Message | InteractionResponse;

interface CollectorOptions<T extends ButtonInteraction | StringSelectMenuInteraction> {
    source: CollectorSource,
    collect(interaction: T): any
    end?: (collected: Collection<string, T>, reason: string) => any
    collectorOptions?: Omit<MessageComponentCollectorOptions<T>, "componentType">
}

export class DiscordTools {
    public static createRowButtons(...components: Array<ButtonBuilder>){
        return new ActionRowBuilder<ButtonBuilder>({components})
    }
    public static createRowSelects(selectMenu: StringSelectMenuBuilder){
        return new ActionRowBuilder<StringSelectMenuBuilder>({components: [selectMenu]})
    }
    public static buttonCollector({source, collect, end, collectorOptions }: CollectorOptions<ButtonInteraction>){
        const collector = source.createMessageComponentCollector({componentType: ComponentType.Button, ...collectorOptions});
        collector.on("collect", collect);
        if (end) collector.on("end", end);
        return collector;
    }
    public static selectCollector({source, collect, end, collectorOptions }: CollectorOptions<StringSelectMenuInteraction>){
        const collector = source.createMessageComponentCollector({componentType: ComponentType.StringSelect, ...collectorOptions});
        collector.on("collect", collect);
        if (end) collector.on("end", end);
        return collector;
    }
}