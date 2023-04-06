import { ChannelType, Guild, GuildTextBasedChannel, TextChannel } from "discord.js";

export class GuildManager {
    public guild: Guild
    constructor(guild: Guild){
        this.guild = guild;
    }
    public findChannel<T = GuildTextBasedChannel>(name: string, type: ChannelType){
        return this.guild.channels.cache.find(c => c.name == name && c.type == type) as T || undefined
    }
    public findChannelInCategory<T = GuildTextBasedChannel>(name: string, type: ChannelType, category: string){
        return this.guild.channels.cache.find(c => c.name == name && c.type == type && c.parent?.name == category) as T || undefined
    }
    public findRole(name: string){
        return this.guild.roles.cache.find(r => r.name == name);
    }
    public findEmoji(name: string){
        return this.guild.client.emojis.cache.find(r => r.name == name);
    }
    public findMessageInGuild(id: string){
        const channels = this.guild.channels.cache.filter(c => c.type == ChannelType.GuildText).map(c => c) as TextChannel[];
        for (const currChannel of channels) {
            const message = currChannel.messages.cache.get(id)
            if (message) return message;
        }
    }
}