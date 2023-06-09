import { ChannelType } from "discord.js";
import { client, config } from "../../..";
import { Event } from "../../../app/base";
import { findChannel } from "../../../app/functions";

const excludeChannels = [
    config.guild.channels.staff,
    config.guild.channels.dev,
    config.guild.channels.work,
    config.guild.channels.logs
];

export default new Event({ name: "messageDelete", async run(message){
    const { guild, channel, member } = message;
    if (!guild || guild.id != client.mainGuildId || 
        channel.type != ChannelType.GuildText || 
        !member || member.id == guild.ownerId || 
        member.id === client.user?.id
    ) return;

    const cLogs = findChannel(guild, config.guild.channels.logs, ChannelType.GuildText); 

    if (!cLogs) return;
    if (excludeChannels.includes(channel.name)) return;

    const time = `<t:${~~(Date.now() / 1000)}:t>`;
    const replyOptions = {
        content: `${time} 🗑️ ${message.channel} **@${message.member?.user.username}** `,
        files: [] as any[]
    };

    if (message.content) {
        replyOptions.content += `\`${message.content}\``;
    }

    if (message.attachments) {
        replyOptions.files = message.attachments.map(a => a);
    }

    cLogs.send(replyOptions);
}});