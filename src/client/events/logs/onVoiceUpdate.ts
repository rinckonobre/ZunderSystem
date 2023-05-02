import { Event, client } from "@/app";
import { findChannel, findEmoji } from "@/app/functions";
import { ChannelType, GuildMember, TextChannel } from "discord.js";


export default new Event({name: "voiceStateUpdate", async run(oldState, newState){
	if (newState.guild.id != client.mainGuildID || oldState.channel === newState.channel) return;
    
    const { guild, member } = newState;
    if (!member) return;
    
    const cLogs = findChannel(guild, "logs", ChannelType.GuildText);
    if (!cLogs) return;

    const text1 = `<t:${~~(Date.now() / 1000)}:t> ${findEmoji(client, "minus")} **${member.user.tag}** saiu de ${oldState.channel}`;
    const text2 = `<t:${~~(Date.now() / 1000)}:t> ${findEmoji(client, "plus")} **${member.user.tag}** entrou em ${newState.channel}`;

    if (oldState.channel) cLogs.send({content: text1});
    if (newState.channel) cLogs.send({content: text2});

}});