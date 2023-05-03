import { AwaitMessagesOptions, ButtonInteraction, ComponentType, InteractionResponse, Message, StringSelectMenuInteraction, TextBasedChannel } from "discord.js";

interface awaitButtonOptions {
    time?: number,
    filter?: (interaction: ButtonInteraction) => any;
}
export async function awaitButton(message: Message | InteractionResponse, options: awaitButtonOptions = {}){
    const componentType = ComponentType.Button;
    return await message.awaitMessageComponent({componentType, ...options}).catch(() => null);
}
interface awaitStringSelectOptions {
    time?: number,
    filter?: (interaction: StringSelectMenuInteraction) => any;
}
export async function awaitStringSelect(message: Message | InteractionResponse, options: awaitStringSelectOptions = {}){
    const componentType = ComponentType.StringSelect;
    return await message.awaitMessageComponent({componentType, ...options}).catch(() => null);
}

export async function awaitMessages(channel: TextBasedChannel, options: AwaitMessagesOptions = {}){
    return await channel.awaitMessages(options).catch(() => null);
}