import { ButtonInteraction, ColorResolvable, CommandInteraction, EmbedBuilder, GuildMember, Message, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { config } from "../..";
import { logger } from "../../functions";

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
    constructor(source: BreakSources, text: string, options?: BreakInteractionOptions){
        (async function execute(){
            const member = source.member as GuildMember

            const embed = new EmbedBuilder()
            .setColor(config.colors.danger as ColorResolvable)
            .setDescription("> " + text);

            if (options?.color) embed.setColor(options.color as ColorResolvable)
            if (options?.editEmbed) options.editEmbed(embed)
            if (!options?.disableFooter) {
                if (source instanceof Message) {
                    embed.setFooter({iconURL: member.displayAvatarURL(), text: member.displayName})
                } else {
                    embed.setFooter({iconURL: member.displayAvatarURL(), text: "Clique em ignorar mensagem para fechar!"})
                }
            }
            const embeds = [embed];
    
            if (source instanceof Message){
                source.reply({embeds}).then(msg => {

                    setTimeout(() => {
    
                        msg.delete().catch(logger)
    
                    }, options?.deleteTime || 8000)

                }).catch(logger)
                return;
            }

            if (source instanceof CommandInteraction) {
                if (source.replied) {
                    if (options?.replace){
                        source.editReply({embeds, content: null, components: [], files: [], attachments: []}).catch(logger)
                    } else {
                        source.followUp({ephemeral: true, embeds}).catch(logger)
                    }
                    return;
                }

                if (source.deferred){
                    source.editReply({embeds}).catch(logger)
                    return;
                }

                source.reply({ephemeral: true, embeds}).catch(logger)
                return;
            }

            if (source instanceof StringSelectMenuInteraction|| source instanceof ButtonInteraction){
                if (source.replied) {
                    if (options?.replace){
                        source.editReply({embeds, content: null, components: [], files: [], attachments: []}).catch(logger)
                    } else {
                        source.followUp({ephemeral: true, embeds}).catch(logger)
                    }
                    return;
                }

                if (options?.replace) {
                    source.update({embeds, content: null, components: [], files: [], attachments: []}).catch(logger)
                } else {
                    source.reply({ephemeral: true, embeds}).catch(logger)
                }

                return;
            }

            if (source instanceof ModalSubmitInteraction) {
                if (source.replied) {
                    if (options?.replace){
                        source.editReply({embeds, content: null, components: [], files: [], attachments: []}).catch(logger)
                    } else {
                        source.followUp({ephemeral: true, embeds}).catch(logger)
                    }
                    return;
                }

                if (source.deferred){
                    source.editReply({embeds}).catch(logger)
                    return;
                }

                source.reply({ephemeral: true, embeds}).catch(logger)
                return;
            }
        })()
    }
}
