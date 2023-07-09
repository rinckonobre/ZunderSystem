import { ApplicationCommandData, ApplicationCommandType, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, ModalSubmitInteraction, StringSelectMenuInteraction, UserContextMenuCommandInteraction } from "discord.js";

type CommandProps = {
    dmPermission?: true,
    type: ApplicationCommandType.ChatInput,
    run(interaction: ChatInputCommandInteraction): any;
    autoComplete?: (interaction: AutocompleteInteraction) => any;
} | {
    dmPermission?: true,
    type: ApplicationCommandType.User,
    run(interaction: UserContextMenuCommandInteraction): any;
} | {
    dmPermission?: true,
    type: ApplicationCommandType.Message,
    run(interaction: MessageContextMenuCommandInteraction): any;
} | {
    type: ApplicationCommandType.ChatInput,
    dmPermission?: false,
    run(interaction: ChatInputCommandInteraction<"cached">): any;
    autoComplete?: (interaction: AutocompleteInteraction<"cached">) => any;
} | {
    type: ApplicationCommandType.User,
    dmPermission?: false,
    run(interaction: UserContextMenuCommandInteraction<"cached">): any;
} | {
    type: ApplicationCommandType.Message,
    dmPermission?: false,
    run(interaction: MessageContextMenuCommandInteraction<"cached">): any;
}

export type StringSelectCommandComponents = Record<string, (interaction: StringSelectMenuInteraction) => any>
export type ModalCommandComponents = Record<string, (interaction: ModalSubmitInteraction) => any>
export type ButtonCommandComponents = Record<string, (interaction: ButtonInteraction) => any>

interface CommandComponents {
    stringSelects?: StringSelectCommandComponents,
    modals?: ModalCommandComponents
    buttons?: ButtonCommandComponents
}

export type CommandData = CommandProps & ApplicationCommandData & Partial<CommandComponents> & {
    visibility: "private" | "public" | "restricted",
    autoComplete?: (interaction: AutocompleteInteraction) => any
}

export class Command {
    public readonly name;
    public readonly data;
    constructor(data: CommandData){
        this.name = data.name;
        this.data = data;
    }
}