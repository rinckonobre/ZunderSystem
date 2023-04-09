import { ButtonInteraction, ChannelSelectMenuInteraction, ComponentType, MentionableSelectMenuInteraction, Message, MessageCollectorOptions, MessageComponentCollectorOptions, RoleSelectMenuInteraction, StringSelectMenuInteraction, TextChannel, UserSelectMenuInteraction } from "discord.js";

export function messageCollector(channel: TextChannel, options?: MessageCollectorOptions){
    return channel.createMessageCollector(options);
}
export function buttonCollector(message: Message, options?: Omit<MessageComponentCollectorOptions<ButtonInteraction>, "componentType">){
    return message.createMessageComponentCollector({componentType: ComponentType.Button, ...options})
}
export function stringSelectCollector(message: Message, options?: Omit<MessageComponentCollectorOptions<StringSelectMenuInteraction>, "componentType">){
    return message.createMessageComponentCollector({componentType: ComponentType.StringSelect, ...options})
}
export function channelSelectCollector(message: Message, options?: Omit<MessageComponentCollectorOptions<ChannelSelectMenuInteraction>, "componentType">){
    return message.createMessageComponentCollector({componentType: ComponentType.ChannelSelect, ...options})
}
export function roleSelectCollector(message: Message, options?: Omit<MessageComponentCollectorOptions<RoleSelectMenuInteraction>, "componentType">){
    return message.createMessageComponentCollector({componentType: ComponentType.RoleSelect, ...options})
}
export function userSelectCollector(message: Message, options?: Omit<MessageComponentCollectorOptions<UserSelectMenuInteraction>, "componentType">){
    return message.createMessageComponentCollector({componentType: ComponentType.UserSelect, ...options})
}
export function mentionableSelectCollector(message: Message, options?: Omit<MessageComponentCollectorOptions<MentionableSelectMenuInteraction>, "componentType">){
    return message.createMessageComponentCollector({componentType: ComponentType.MentionableSelect, ...options})
}