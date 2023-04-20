import {
    ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle,
    ChannelSelectMenuInteraction,
    Collection, ColorResolvable, ComponentEmojiResolvable, ComponentType,
    EmbedBuilder, InteractionResponse, Message, MessageCollectorOptions, StringSelectMenuInteraction, TextChannel, TextInputBuilder, TextInputComponentData
} from "discord.js";

type CollectorTypes = ButtonInteraction | StringSelectMenuInteraction;

// Collectors
type ButtonCollectFunc = (interaction: ButtonInteraction) => any
type SelectCollectFunc = (interaction: StringSelectMenuInteraction) => any
type ChannelSelectCollectFunc = (interaction: ChannelSelectMenuInteraction) => any
type MessageCollectFunc = (message: Message) => any
type ButtonEndFunc = (collected: Collection<string, ButtonInteraction>, reason?: string) => any
type SelectEndFunc = (collected: Collection<string, StringSelectMenuInteraction>, reason?: string) => any
type ChannelSelectEndFunc = (collected: Collection<string, ChannelSelectMenuInteraction>, reason?: string) => any
type MessageEndFunc = (collected: Collection<string, Message>, reason?: string) => any

export class DiscordCreate {
    public static buttonCollector(msg: Message | InteractionResponse, collectFunction: ButtonCollectFunc, endFunction?: ButtonEndFunc){
        const collector = msg.createMessageComponentCollector({componentType: ComponentType.Button})
        collector.on('collect', collectFunction);
        if (endFunction) collector.on('end', endFunction);

        return collector;
    }
    public static channelSelectCollector(msg: Message | InteractionResponse, collectFunction: ChannelSelectCollectFunc, endFunction?: ChannelSelectEndFunc){
        const collector = msg.createMessageComponentCollector({componentType: ComponentType.ChannelSelect})
        collector.on('collect', collectFunction);
        if (endFunction) collector.on('end', endFunction);
        return collector;
    }
    public static selectCollector(msg: Message | InteractionResponse, collectFunction: SelectCollectFunc, endFunction?: SelectEndFunc){
        const collector = msg.createMessageComponentCollector({componentType: ComponentType.StringSelect})
        collector.on('collect', collectFunction);
        if (endFunction) collector.on('end', endFunction);

        return collector;
    }
    public static messageCollector(channel: TextChannel, options: MessageCollectorOptions, collectFunction: MessageCollectFunc, endFunction?: MessageEndFunc){
        const collector = channel.createMessageCollector(options);
        collector.on('collect', collectFunction)
        if (endFunction) collector.on('end', endFunction)

        return collector;
    }
    public static textInput(textInputData: TextInputComponentData){
        return new ActionRowBuilder<TextInputBuilder>({ components: [textInputData] })
    }
    public static simpleEmbed(color: string, description: string){
        return new EmbedBuilder().setColor(color as ColorResolvable).setDescription(description);
    }
    
    public static button(
        customIdOrUrl: string, 
        label: string, 
        style: ButtonStyle,
        disabled?: boolean,
        emoji?: ComponentEmojiResolvable){

            const button = new ButtonBuilder({
                label,
                disabled,
                emoji,
            })

            button.setStyle(style)

            if (style == ButtonStyle.Link) {
                button.setURL(customIdOrUrl)
            } else {
                button.setCustomId(customIdOrUrl);
            }

            return button;
    }
}
