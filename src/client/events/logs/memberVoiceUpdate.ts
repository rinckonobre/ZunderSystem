import { Event, GuildManager, client } from "@/app";
import { ChannelType, GuildMember, TextChannel } from "discord.js";


export default new Event({name: "voiceStateUpdate", async run(oldState, newState){
	if (newState?.guild?.id != client.mainGuildID || oldState.channel === newState.channel) return;
    
    const member = newState.member as GuildMember;
    const guildManager = new GuildManager(newState.guild);
    
    const cLogs = guildManager.findChannel<TextChannel>("logs", ChannelType.GuildText);
    if (!cLogs) return;

    const text1 = `<t:${~~(Date.now() / 1000)}:t> - **${member.user.tag}** saiu de ${oldState.channel}`;
    const text2 = `<t:${~~(Date.now() / 1000)}:t> + **${member.user.tag}** entrou em ${newState.channel}`;

    if (oldState.channel) cLogs.send({content: text1});
    if (newState.channel) cLogs.send({content: text2});

}});