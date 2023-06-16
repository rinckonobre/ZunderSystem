import { ChannelType } from "discord.js";
import { Event } from "../../../app/base";
import { client } from "../../..";
import { findChannel, findEmoji } from "../../../app/functions";

export default new Event({name: "voiceStateUpdate", async run(oldState, newState){
	if (newState.guild.id != client.mainGuildID || oldState.channel === newState.channel) return;
    
    const { guild, member } = newState;
    if (!member) return;
    
    const cLogs = findChannel(guild, "logs", ChannelType.GuildText);
    if (!cLogs) return;

    const text1 = `<t:${~~(Date.now() / 1000)}:t> ${findEmoji(client, "minus")} **@${member.user.username}** saiu de ${oldState.channel}`;
    const text2 = `<t:${~~(Date.now() / 1000)}:t> ${findEmoji(client, "plus")} **@${member.user.username}** entrou em ${newState.channel}`;

    if (oldState.channel) cLogs.send({content: text1});
    if (newState.channel) cLogs.send({content: text2});

}});