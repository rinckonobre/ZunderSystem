import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, TextChannel } from "discord.js";
import { client, config } from "../..";
import { systemWork } from "../../functions/systems/system-work";
import { works } from "../../jsons";
import { DocumentPlayer, Event, Firestore, ServerManager } from "../../structs";

const playersColl = new Firestore("players");

export default new Event({name: "messageCreate", async run(message){
    if (message.channel.type != ChannelType.GuildText ||
        message.channel.name != config.guild.channels.work ||
        !message.guild || message.guild?.id != client.mainGuildID ||
        !message.member || message.member.user.bot
    ) return;
    
    const attach = message.attachments.at(0);

    if (message.attachments.size != 1) {
        message.delete().catch(() => {})
        return;
    };

    if (!attach) {
        message.delete().catch(() => {})
        return;
    };
    
    const cWork = ServerManager.findChannel(message.guild, config.guild.channels.work, ChannelType.GuildText) as TextChannel | undefined;
    if (!cWork) {
        message.delete().catch(() => {})
        return;
    };

    const memberData = await playersColl.getDocData(message.member.id) as DocumentPlayer | undefined;
    if (!memberData || !memberData.work) {
        message.delete().catch(() => {})
        return;
    };
    
    if (memberData.work.level >= 20 || (memberData.registry?.level || 1) >= 3) {
        message.delete().catch(() => {})
        systemWork.accept(message.member, attach, memberData);
        return;
    }


    const profession = works
    .find(sector => sector.id == memberData.work?.gameID)!.professions
    .find((profession) => profession.id === memberData.work?.profession)!
    
    message.delete().catch(() => {})
    
    const row = new ActionRowBuilder<ButtonBuilder>({components: [
        new ButtonBuilder({customId: "work-approve-button", label: "Aprovar", style: ButtonStyle.Success}),
        new ButtonBuilder({customId: "work-recuse-button", label: "Recusar", style: ButtonStyle.Danger}),
        new ButtonBuilder({url: message.url, label: profession.name, emoji: profession.emoji, style: ButtonStyle.Link})
    ]})
    
    cWork.send({content: message.member.id, files: [attach], components: [row]});
}});