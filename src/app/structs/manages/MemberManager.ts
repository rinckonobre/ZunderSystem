import { EmbedBuilder, EmbedData, GuildMember } from "discord.js";


export class MemberCooldowns {
    public static AntiFloodCall: Map<GuildMember, number> = new Map();
    public static AntiFloodChat: Map<GuildMember, number> = new Map();
    public static Economy: Map<GuildMember, number> = new Map();
}

export class MemberSaves {
    public static EmbedEdit: Map<string, EmbedBuilder> = new Map();
}