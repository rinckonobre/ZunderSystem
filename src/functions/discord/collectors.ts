import { ButtonInteraction, ComponentType, Message, MessageCollectorOptions, MessageComponentCollectorOptions, StringSelectMenuInteraction, TextChannel } from "discord.js";

export function messageCollector(channel: TextChannel, options?: MessageCollectorOptions){
    return channel.createMessageCollector(options);
}
export function buttonCollector(message: Message, options?: Omit<MessageComponentCollectorOptions<ButtonInteraction>, "componentType">){
    return message.createMessageComponentCollector({componentType: ComponentType.Button, ...options})
}
export function stringSelectCollector(message: Message, options?: Omit<MessageComponentCollectorOptions<StringSelectMenuInteraction>, "componentType">){
    return message.createMessageComponentCollector({componentType: ComponentType.StringSelect, ...options})
}