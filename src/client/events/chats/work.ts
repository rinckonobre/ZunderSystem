
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";
import { Event } from "../../../app/base";
import { client, config, db } from "../../..";
import { findChannel, systemWork } from "../../../app/functions";
import { DocumentPlayer } from "../../../app/interfaces";
import { works } from "../../../settings/jsons";

export default new Event({name: "messageCreate", async run(message){
    const { channel, guild, member } = message;
    if (channel.type != ChannelType.GuildText ||
        channel.name != config.guild.channels.work ||
        !guild || guild?.id != client.mainGuildID ||
        !member || member.user.bot
    ) return;
    
    const attach = message.attachments.at(0);

    if (message.attachments.size != 1) {
        message.delete().catch(() => {});
        return;
    }

    if (!attach) {
        message.delete().catch(() => {});
        return;
    }
    
    const cWork = findChannel(guild, config.guild.channels.work, ChannelType.GuildText);
    if (!cWork) {
        message.delete().catch(() => {});
        return;
    }

    const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
    if (!memberData || !memberData.work) {
        message.delete().catch(() => {});
        return;
    }
    
    if (memberData.work.level >= 20 || (memberData.registry?.level || 1) >= 3) {
        message.delete().catch(() => {});
        systemWork.accept(member, attach, memberData);
        return;
    }


    const profession = works
    .find(sector => sector.id == memberData.work?.gameID)!.professions
    .find((profession) => profession.id === memberData.work?.profession)!;
    
    message.delete().catch(() => {});
    
    const row = new ActionRowBuilder<ButtonBuilder>({components: [
        new ButtonBuilder({customId: "work-approve-button", label: "Aprovar", style: ButtonStyle.Success}),
        new ButtonBuilder({customId: "work-recuse-button", label: "Recusar", style: ButtonStyle.Danger}),
        new ButtonBuilder({url: message.url, label: profession.name, emoji: profession.emoji, style: ButtonStyle.Link})
    ]});
    
    cWork.send({content: member.id, files: [attach], components: [row]});
}});