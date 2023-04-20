import { ChannelType, Client, ColorResolvable, EmbedBuilder, Guild, GuildMember, TextChannel } from "discord.js";
import { config } from "../..";
import { GuildManager } from "../../structs";


interface RecordMessage {
    system: {
        title: string;
        color: string;
        style: "SIMPLE" | "FULL";
    };
    details: string,
    mention?: GuildMember,
    staff: GuildMember | Client
}

function send(guild: Guild, {system, details, staff, mention}: RecordMessage){
    const guildManager = new GuildManager(guild);
    const cRecords = guildManager.findChannel<TextChannel>(config.guild.channels.records, ChannelType.GuildText);

    const embed = new EmbedBuilder()
    .setColor(system.color as ColorResolvable)
    .setDescription(details)
    .setTimestamp();

    if (system.style == "FULL"){
        embed.setTitle(system.title);
        if (mention) embed.setThumbnail(mention.displayAvatarURL())
    } else {
        if (mention) embed.setAuthor({name: system.title, iconURL: mention.displayAvatarURL()})
        else embed.setTitle(system.title);
    }
    
    if (staff instanceof GuildMember) {
        embed.setFooter({text: `Por ${staff.displayName} \nAdministração Zunder`, iconURL: staff.displayAvatarURL()})
    } else {
        embed.setFooter({text: `Por ${staff.user?.username || "Sistema"} \nAdministração Zunder`, iconURL: staff.user?.displayAvatarURL()})
    }

    cRecords?.send({embeds: [embed]})
}

export const systemRecords = {
    send
}