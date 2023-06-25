import { ChannelType, Collection, EmbedBuilder } from "discord.js";
import { Event } from "../../../app/base";
import { client, config } from "../../..";
import { convertHex, findChannel, logger, wait } from "../../../app/functions";

const members: Collection<string, number> = new Collection();

export default new Event({
    name: "voiceStateUpdate", async run(oldState, newState) {

        if (newState.guild.id !== client.mainGuildId
            || oldState.channel === newState.channel
        ) return;

        const {guild, member, channel } = newState;
        if (!member || member.id == guild.ownerId || !channel) return;

        const cGeneral = findChannel(guild, config.guild.channels.general, ChannelType.GuildText);
        const cTerms = findChannel(guild, config.guild.channels.terms);

        const count = members.get(member.id);
        if (!count){
            members.set(member.id, 1);
            return;
        }

        const newCount = count + 1;
        members.set(member.id, newCount);

        if (newCount > 4){
            members.delete(member.id);
            member.timeout(60*1000, "Entrando e saindo de salas várias vezes");

            cGeneral?.send({content: `||${member}||`, embeds: [new EmbedBuilder({
                color: convertHex(config.colors.theme.danger),
                description: `${member} evite ficar entrando e saindo das salas diversas vezes em um curto período por favor!
                > Leia os ${cTerms} do servidor para evitar punições`
            })]})
            .then(async message => {
                await wait(60*1000);
                message.delete().catch(logger);
            });
            
            return;
        }

        setTimeout(() => {
            const currCount = members.get(member.id);
            if (!currCount) return;
            members.set(member.id, currCount - 1);
        }, 6000);
    }
});