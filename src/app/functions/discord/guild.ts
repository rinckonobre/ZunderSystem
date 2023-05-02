import { CategoryChannel, ChannelType, Client, ForumChannel, Guild, GuildBasedChannel, NewsChannel, StageChannel, TextChannel, VoiceChannel } from "discord.js";

function findChannel(guild: Guild, name: string, type?: ChannelType.GuildText, category?: string): TextChannel | undefined
function findChannel(guild: Guild, name: string, type?: ChannelType.GuildVoice, category?: string): VoiceChannel | undefined
function findChannel(guild: Guild, name: string, type?: ChannelType.GuildCategory, category?: string): CategoryChannel | undefined
function findChannel(guild: Guild, name: string, type?: ChannelType.GuildAnnouncement, category?: string): NewsChannel | undefined
function findChannel(guild: Guild, name: string, type?: ChannelType.GuildForum, category?: string): ForumChannel | undefined
function findChannel(guild: Guild, name: string, type?: ChannelType.GuildStageVoice, category?: string): StageChannel | undefined 
function findChannel(guild: Guild, name: string, type?: ChannelType.GuildStageVoice, category?: string):  | undefined 
function findChannel(guild: Guild, name: string, type?: ChannelType, category?: string){
    const { cache } = guild.channels;
    if (type && category) return cache.find(c => c.name == name && c.type == type && c.parent?.name == category);
    else if (type) return cache.find(c => c.name == name && c.type == type);
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
