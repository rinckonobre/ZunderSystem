import { ChannelType, GuildMember, TextChannel } from "discord.js";
import { client, config } from "../..";

import { DiscordCreate, Event, GuildManager, MemberCooldowns } from "../../structs";

export default new Event({
    name: 'voiceStateUpdate', async run(oldState, newState) {

        if (newState?.guild?.id !== client.mainGuildID
            || oldState.channel === newState.channel)
            return;

        const member = newState.member as GuildMember;
        const guildManager = new GuildManager(newState.guild);

        if (member.id == guildManager.guild.ownerId) return;

        const cGeneral = guildManager.findChannel<TextChannel>(config.guild.channels.general, ChannelType.GuildText);
        const cTerms = guildManager.findChannel<TextChannel>(config.guild.channels.terms, ChannelType.GuildText);

        if (newState.channel) {

            const times = MemberCooldowns.AntiFloodCall.get(member)
            if (!times) {
                MemberCooldowns.AntiFloodCall.set(member, 1)
            } else {

                MemberCooldowns.AntiFloodCall.set(member, times + 1)

                if (times + 1 > 5) {
                    MemberCooldowns.AntiFloodCall.delete(member);

                    const embed = DiscordCreate.simpleEmbed(config.colors.danger, `${member} por favor evite ficar entrando e saindo das salas
                diversas vezes em um curto período de tempo!
                Leia os [termos](${cTerms?.url}) do grupo para evitar punições!`);

                    member.timeout(60 * 1000);

                    cGeneral?.send({ content: `||${member}||`, embeds: [embed] }).then((msg) => {
                        setTimeout(() => {

                            msg.delete().catch(() => { });

                        }, 60 * 1000);
                    })

                    return;
                }

                setTimeout(() => {
                    MemberCooldowns.AntiFloodCall.set(member, times - 1);
                }, 6000);
            }

        }
    }
})