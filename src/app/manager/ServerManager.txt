import { ChannelType, Guild, GuildTextBasedChannel, StageChannel } from "discord.js";

export class ServerManager {
    public static findEmoji(guild: Guild, name: string){
        return guild.client.emojis.cache.find(e => e.name === name);
    }
    public static findRole(guild: Guild, name: string){
        return guild.roles.cache.find(r => r.name === name);
    }
    public static findChannel(guild: Guild, name: string, type?: ChannelType){
        if (type) {
            return guild.channels.cache.find(c => c.name === name && c.type === type);
        } else {
            return guild.channels.cache.find(c => c.name === name);
        }
    }
    public static async findMessage(channel: GuildTextBasedChannel, id: string){
        if (channel instanceof StageChannel) return undefined;
        const messages = await channel.messages.fetch();
        return messages.get(id);
    }
}