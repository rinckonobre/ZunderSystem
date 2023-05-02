import { ButtonInteraction, ColorResolvable, CommandInteraction, EmbedBuilder, GuildMember, Message, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { config } from "../..";
import { logger } from "../functions";

type BreakSources = CommandInteraction
| ButtonInteraction 
| StringSelectMenuInteraction 
| ModalSubmitInteraction 
| Message

interface BreakInteractionOptions {
    deleteTime?: number;
    replace?: boolean;
    disableFooter?: boolean;
    color?: string | ColorResolvable;
    editEmbed?: (embed: EmbedBuilder) => any;
}

export class BreakInteraction {
    constructor(source: BreakSources, text: string, options: BreakInteractionOptions = {}){
        const { color, deleteTime, disableFooter, editEmbed, replace } = options;

        function handleDeleteMessage(message: Message){
            setTimeout(() => {
                message.delete().catch(logger);
            }, deleteTime || 8000);
        }

        (async function execute(){
            const member = source.member as GuildMember;

            const embed = new EmbedBuilder()
            .setColor(config.colors.danger as ColorResolvable)
            .setDescription("> " + text);

            if (color) embed.setColor(color as ColorResolvable);
            if (editEmbed) editEmbed(embed);
            if (!disableFooter) {
                if (source instanceof Message) {
                    embed.setFooter({iconURL: member.displayAvatarURL(), text: member.displayName});
                } else {
                    embed.setFooter({iconURL: member.displayAvatarURL(), text: "Clique em ignorar mensagem para fechar!"});
                }
            }
            const embeds = [embed];
    
            if (source instanceof Message){
                source.reply({embeds})
                .then(handleDeleteMessage)
                .catch(logger);
                return;
            }

            if (source instanceof CommandInteraction) {
                if (source.replied) {
                    if (options?.replace){
                        source.editReply({embeds, content: null, components: [], files: [], attachments: []})
                        .then(message => {
                            if (deleteTime) handleDeleteMessage(message);
                        })
                        .catch(logger);
                    } else {
                        source.followUp({ephemeral: true, embeds})
                        .then(message => {
                            if (deleteTime) handleDeleteMessage(message);
                        })
                        .catch(logger);
                    }
                    return;
                }

                if (source.deferred){
                    source.editReply({embeds})
                    .then(message => {
                        if (deleteTime) handleDeleteMessage(message);
                    })
                    .catch(logger);
                    return;
                }

                source.reply({ephemeral: true, embeds}).catch(logger);
                return;
            }

            if (source instanceof StringSelectMenuInteraction|| source instanceof ButtonInteraction){
                if (source.replied) {
                    if (options?.replace){
                        source.editReply({embeds, content: null, components: [], files: [], attachments: []})
                        .then(message => {
                            if (deleteTime) handleDeleteMessage(message);
                        })
                        .catch(logger);
                    } else {
                        source.followUp({ephemeral: true, embeds})
                        .then(message => {
                            if (deleteTime) handleDeleteMessage(message);
                        })
                        .catch(logger);
                    }
                    return;
                }

                if (options?.replace) {
                    source.update({embeds, content: null, components: [], files: [], attachments: [], fetchReply: true})
                    .then(message => {
                        if (deleteTime) handleDeleteMessage(message);
                    })
                    .catch(logger);
                } else {
                    source.reply({ephemeral: true, embeds, fetchReply: true})
                    .then(message => {
                        if (deleteTime) handleDeleteMessage(message);
                    })
                    .catch(logger);
                }

                return;
            }

            if (source instanceof ModalSubmitInteraction) {
                if (source.replied) {
                    if (options?.replace){
                        source.editReply({embeds, content: null, components: [], files: [], attachments: []})
                        .then(message => {
                            if (deleteTime) handleDeleteMessage(message);
                        })
                        .catch(logger);
                    } else {
                        source.followUp({ephemeral: true, embeds})
                        .then(message => {
                            if (deleteTime) handleDeleteMessage(message);
                        })
                        .catch(logger);
                    }
                    return;
                }

                if (source.deferred){
                    source.editReply({embeds})
                    .then(message => {
                        if (deleteTime) handleDeleteMessage(message);
                    })
                    .catch(logger);
                    return;
                }

                source.reply({ephemeral: true, embeds, fetchReply: true})
                .then(message => {
                    if (deleteTime) handleDeleteMessage(message);
                })
                .catch(logger);
                return;
            }
        })();
    }
}
