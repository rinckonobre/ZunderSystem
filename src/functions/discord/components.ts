import { ButtonInteraction, ComponentType, InteractionCollectorOptions, Message, StringSelectMenuInteraction } from "discord.js";


interface awaitButtonOptions {
    time?: number,
    filter?: (interaction: ButtonInteraction) => any;
}
export async function waitButton(message: Message, options: awaitButtonOptions = {}){
    const componentType = ComponentType.Button;
    return await message.awaitMessageComponent({componentType, ...options}).catch(() => null);
}

interface awaitStringSelectOptions {
    time?: number,
    filter?: (interaction: StringSelectMenuInteraction) => any;
}
export async function waitStringSelect(message: Message, options: awaitStringSelectOptions = {}){
    const componentType = ComponentType.StringSelect;
    return await message.awaitMessageComponent({componentType, ...options}).catch(() => null);
}