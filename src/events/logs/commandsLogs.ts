import { ChannelType, chatInputApplicationCommandMention, ChatInputCommandInteraction, CommandInteractionOptionResolver, ComponentType, InteractionType, MessageContextMenuCommandInteraction, TextChannel, UserContextMenuCommandInteraction } from "discord.js";
import { config } from "../..";
import { Event, GuildManager } from "../../structs";

export default new Event({name: "interactionCreate", async run(interaction){
    const { id, channel, guild, user, type } = interaction
    if (!guild) return;

    const guildManager = new GuildManager(guild);
    const cLogs = guildManager.findChannel<TextChannel>(config.guild.channels.logs, ChannelType.GuildText);
    if (!cLogs) return;

    const time = `<t:${~~(Date.now() / 1000)}:t>`;
    let content = `${time} **${user.tag}** `

    const format = chatInputApplicationCommandMention;

    if (type == InteractionType.ApplicationCommand) {
        const {commandName, commandId } = interaction
        const options = interaction.options as CommandInteractionOptionResolver

        const [ subCommandGroup, subCommand ] = [
            options.getSubcommandGroup(false), options.getSubcommand(false)
        ]

        if (interaction instanceof UserContextMenuCommandInteraction) {
            content += `usou \`User/Apps/${commandName}\``
        }
        
        if (interaction instanceof MessageContextMenuCommandInteraction) {
            content += `usou \`Message/Apps/${commandName}\``
        }

        if (interaction instanceof ChatInputCommandInteraction) {

            if (subCommandGroup) {
                content += `usou ${format(commandName, subCommandGroup, subCommand!, commandId, )}`
            } else if (subCommand) {
                content += `usou ${format(commandName, subCommand, commandId, )}`
            } else {
                content += `usou ${format(commandName, commandId)}`
            }
        }
    }

    if (type == InteractionType.MessageComponent){
        const { customId, componentType } = interaction;
        const formatTypes: Map<ComponentType, string> = new Map([
            [ComponentType.ActionRow, "linha de ação"],
            [ComponentType.Button, "botão"],
            [ComponentType.ChannelSelect, "menu de seleção de canais"],
            [ComponentType.MentionableSelect, "menu de seleção de menção"],
            [ComponentType.RoleSelect, "menu de seleção de cargos"],
            [ComponentType.StringSelect, "menu de seleção"],
            [ComponentType.TextInput, "entrada de text"],
            [ComponentType.UserSelect, "menu de seleção de usuários"],
        ])

        content += `usou ${formatTypes.get(componentType)} \`${customId}\``
    }

    if (type == InteractionType.ModalSubmit) {
        content += `usou o modal \`${interaction.customId}\``
    }

    if (channel) {
        content += ` em ${channel}`
    }

    cLogs.send({content})

}})