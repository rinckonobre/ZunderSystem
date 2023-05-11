import { ApplicationCommandData, ApplicationCommandType, AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, Collection, Locale, MessageContextMenuCommandInteraction, ModalSubmitInteraction, StringSelectMenuInteraction, UserContextMenuCommandInteraction } from "discord.js";

interface ChatInputCommandProps {
    type: ApplicationCommandType.ChatInput,
    run(interaction: ChatInputCommandInteraction): any;
}
interface UserContextCommandProps {
    type: ApplicationCommandType.User,
    run(interaction: UserContextMenuCommandInteraction): any;
}
interface MessageContextCommandProps {
    type: ApplicationCommandType.Message,
    run(interaction: MessageContextMenuCommandInteraction): any;
}

export type ButtonComponents = { [key: string]: (interaction: ButtonInteraction) => void };
export type StringSelectComponents = { [key: string]: (interaction: StringSelectMenuInteraction) => void };
export type ModalComponents = { [key: string]: (interaction: ModalSubmitInteraction) => void };

type CommandProps = ChatInputCommandProps | UserContextCommandProps | MessageContextCommandProps

export type CommandType = CommandProps & ApplicationCommandData & {
    visibility: "private" | "public" | "staff",
    autoComplete?: (interaction: AutocompleteInteraction) => any;
    buttons?: ButtonComponents,
    stringSelects?: StringSelectComponents,
    modals?: ModalComponents
}

export class Command {
    constructor(options: CommandType){
        if (!options.dmPermission) options.dmPermission = false;
        Object.assign(this, options);
    }
}

