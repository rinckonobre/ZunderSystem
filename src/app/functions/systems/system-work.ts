import { Attachment, ChannelType, ColorResolvable, EmbedBuilder, GuildMember } from "discord.js";
import { db, config } from "../../..";
import { works } from "../../../settings/jsons";
import { DocumentPlayer } from "../../interfaces";
import { findChannel } from "../discord/guild";
import { systemExperience } from "./system-experience";

export const systemWork = {
    async accept(member: GuildMember, image: Attachment, memberData: DocumentPlayer){
        const guild = member.guild;
        const cWork = findChannel(guild, config.guild.channels.work, ChannelType.GuildText);
        if (!cWork) return;

        const sectorID = memberData.work!.gameID;
        const professionID = memberData.work!.profession;

        const sector = works.find(sector => sector.id === sectorID)!;
        const profession = sector.professions.find(profession => profession.id === professionID)!;

        const embed = new EmbedBuilder()
        .setAuthor({name: member.displayName, iconURL: member.displayAvatarURL()})
        .setTitle(profession.emoji + " " + profession.name)
        .setColor(config.colors.success as ColorResolvable)
        .setDescription(`Jogo: **${sector.game}**
        Modo: \`${profession.mode}\``)
        .setThumbnail("attachment://" + image.name)
        .setFooter({text: "Trabalho aprovado", iconURL: config.images.status.accepted})
        .setTimestamp();

        cWork.send({embeds: [embed], files: [image]});

        //const MemberDataManager = await db.players.get(member.id) as DocumentPlayer | undefined;

        const xp = profession.exp;
        const salary = memberData.work?.salary || 0;
        const dones = memberData.work?.dones || [];

        if (dones.length < 1) {
            dones.push({
                professionID,
                gameID: sectorID,
                amount: 1,
                xpEarned: xp
            });
        } else {
            dones.forEach((item, index) => {
                if (item.professionID == professionID && item.gameID === sectorID) {
                    if (dones[index]) {
                        if (!dones[index].amount) dones[index].amount = 0;
                        if (!dones[index].xpEarned) dones[index].xpEarned = 0;

                        dones[index].amount += 1;
                        dones[index].xpEarned += xp;
                    } else {
                        dones[index] = { amount: 1, xpEarned: xp, gameID: sectorID, professionID };
                    }
                }
            });
        }

        db.players.update(member.id, "work.dones", dones);
        db.players.update(member.id, "work.salary", profession.salary, "increment");
        
        memberData.work!.dones = dones;
        memberData.work!.salary = salary + profession.salary;

        systemExperience.give(member, xp, "work");
        
    },
};