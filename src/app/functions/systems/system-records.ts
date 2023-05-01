import { ChannelType, Client, ColorResolvable, EmbedBuilder, Guild, GuildMember, User } from "discord.js";
import { client, config } from "../..";
import { findChannel } from "../discord/guild";
import { convertHex } from "../app/convert";


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

interface RecordProps {
    guild: Guild,
    style?: "Simple" | "Full"
    title: string,
    color: string,
    description: string,
    mention?: GuildMember | User,
    staff?: GuildMember | User | Client
}

export const systemRecords = {
    send(guild: Guild, {system, details, staff, mention}: RecordMessage){
        const cRecords = findChannel(guild, config.guild.channels.records, ChannelType.GuildText);
    
        const embed = new EmbedBuilder()
        .setColor(system.color as ColorResolvable)
        .setDescription(details)
        .setTimestamp();
    
        if (system.style == "FULL"){
            embed.setTitle(system.title);
            if (mention) embed.setThumbnail(mention.displayAvatarURL());
        } else {
            if (mention) embed.setAuthor({name: system.title, iconURL: mention.displayAvatarURL()});
            else embed.setTitle(system.title);
        }
        
        if (staff instanceof GuildMember) {
            embed.setFooter({text: `Por ${staff.displayName} \nAdministração Zunder`, iconURL: staff.displayAvatarURL()});
        } else {
            embed.setFooter({text: `Por ${staff.user?.username || "Sistema"} \nAdministração Zunder`, iconURL: staff.user?.displayAvatarURL()});
        }
    
        cRecords?.send({embeds: [embed]});
    },
    create({ guild, title, color, description, style = "Full", mention, staff = client }: RecordProps){
        const cRecords = findChannel(guild, config.guild.channels.records, ChannelType.GuildText);
        
        if (!cRecords){
            console.log("Records channel not found!".red);
            return;
        }

        const embed = style == "Full" ?
        new EmbedBuilder({
            title, description, color: convertHex(color), timestamp: new Date()
        }).setThumbnail(mention?.displayAvatarURL({extension: "png"}) || null) :
        new EmbedBuilder({
            description, color: convertHex(color), timestamp: new Date(),
            author: { name: title, iconURL: mention?.displayAvatarURL({extension: "png"}) }
        });

        if (staff instanceof Client){
            embed.setFooter({
                text: `Por ${staff.user?.username || "Sistema"} \nAdministração Zunder`, 
                iconURL: staff.user?.displayAvatarURL()
            });
        } else {
            const staffName = staff instanceof User ? staff.username : staff.displayName;
            embed.setFooter({
                text: `Por ${staffName} \nAdministração Zunder`, 
                iconURL: staff.displayAvatarURL()
            });
        }

        cRecords.send({embeds: [embed]});

    }
};