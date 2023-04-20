import { ApplicationCommandData, AutocompleteInteraction, ButtonInteraction, Collection, CommandInteraction, CommandInteractionOptionResolver, Guild, GuildMember, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { ExtendedClient } from '..';

// Chat Command Props
interface CommandRunProps {
    client: ExtendedClient, 
    options: CommandInteractionOptionResolver
}
interface ChatCommandRunProps extends CommandRunProps {
    interaction: CommandInteraction
}

interface AutocompleteRunProps extends CommandRunProps {
    interaction: AutocompleteInteraction
}

// Components
export type ComponentsButton = Collection<string, (interaction: ButtonInteraction) => any>
export type ComponentsSelect = Collection<string, (interaction: StringSelectMenuInteraction) => any>
export type ComponentsModal = Collection<string, (interaction: ModalSubmitInteraction) => any>

interface CommandComponents {
    buttons?: ComponentsButton,
    selects?: ComponentsSelect,
    modals?: ComponentsModal
}

export type CommandVisibility = "public" | "staff" | "private"

export type CommandType = ApplicationCommandData & CommandComponents & {
    visibility: CommandVisibility
    autocomplete?: (props: AutocompleteRunProps) => any;
    run(props: ChatCommandRunProps): any;
}

export class Command {
    constructor(options: CommandType){
        options.dmPermission = false;
        Object.assign(this, options)
    }
}