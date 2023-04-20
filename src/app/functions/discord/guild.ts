import { CategoryChannel, ChannelType, Client, ForumChannel, Guild, NewsChannel, StageChannel, TextChannel, VoiceChannel } from "discord.js";

function findChannel(guild: Guild, name: string, type: ChannelType.GuildText): TextChannel | undefined
function findChannel(guild: Guild, name: string, type: ChannelType.GuildVoice): VoiceChannel | undefined
function findChannel(guild: Guild, name: string, type: ChannelType.GuildCategory): CategoryChannel | undefined
function findChannel(guild: Guild, name: string, type: ChannelType.GuildAnnouncement): NewsChannel | undefined
function findChannel(guild: Guild, name: string, type: ChannelType.GuildForum): ForumChannel | undefined
function findChannel(guild: Guild, name: string, type: ChannelType.GuildStageVoice): StageChannel | undefined
function findChannel(guild: Guild, name: string, type?: ChannelType){
    const { cache } = guild.channels;
    if (type) return cache.find(c => c.name == name && c.type == type);
    else return cache.find(c => c.name == name);
}

function findRole(guild: Guild, name: string){
    const { cache } = guild.roles;
    return cache.find(r => r.name == name);
}

function findEmoji(client: Client, name: string){
    const { cache } = client.emojis;
    return cache.find(e => e.name == name);
}

export { findChannel, findEmoji, findRole };
