import { EmbedBuilder, ComponentEmojiResolvable } from 'discord.js';

interface CustomMessageLink {
    url: string,
    label: string,
    emoji?: string | ComponentEmojiResolvable
}

export interface CustomMessage {
    content?: string;
    embeds: Array<EmbedBuilder>;
    links: Array<CustomMessageLink>;
    reactions: Array<string | ComponentEmojiResolvable>
}