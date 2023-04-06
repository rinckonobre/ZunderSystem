import { ChannelType, ColorResolvable, EmbedBuilder, GuildMember, TextChannel } from "discord.js";
import { db } from "../..";

import { colors, dcGuild } from "../../config.json";
import { DocPlayer, ServerManager } from "../../structs";

export const systemExperience = {
    getRequiredXp(level: number) {
        return (level > 0) ? level * 982 : 440;
    },
    async give(member: GuildMember, value: number, type: "interaction" | "work") {
        const memberData = await db.players.get(member.id) as DocPlayer | undefined;
        //playersColl.getDocData(member.id) as DocPlayer | undefined;
        if (!memberData) return false;

        if (!memberData[type] && type == "work") return false;
        if (!memberData[type] && type == "interaction"){
            memberData[type] = {level: 0, xp: 0};
        }

        //const MemberDataManager = playersColl.getDocManager(member.id)

        const currLevel = memberData[type]?.level || 0;
        const currXp = memberData[type]?.xp || 0;
        const requiredXp = this.getRequiredXp(currLevel)

        const newXp = currXp + value;
        memberData[type]!.xp = newXp

        //MemberDataManager.set(`${type}.xp`, newXp)
        db.players.update(member.id, `${type}.xp`, newXp)
        
        if (newXp >= requiredXp) {
            //memberData[type]!.level = newLevel;
            //MemberDataManager.set(`${type}.level`, newLevel);
            const newLevel = currLevel + 1;
            await db.players.update(member.id, `${type}.level`, newLevel)
            
            if (newXp > requiredXp) {
                //memberData[type]!.xp = bonusXp;
                const bonusXp = newXp - requiredXp;
                db.players.update(member.id, `${type}.xp`, bonusXp);
            } else {
                //MemberDataManager.set(`${type}.xp`, 0)
                //memberData[type]!.xp = 0;
                db.players.update(member.id, `${type}.xp`, 0);
            }
            
            const coinsReward = 550 + newLevel;
            db.players.update(member.id, "wallet.coins", coinsReward, "increment");

            // if (!memberData.inventory){
            //     MemberDataManager.set(`inventory`, {coins: coinsReward, amplifier: 0});
            //     memberData.inventory = {coins: coinsReward, amplifier: 0};
            // } else {
            //     MemberDataManager.add(`inventory.coins`, coinsReward);
            //     memberData.inventory.coins += coinsReward;
            // }
            const cAudit = ServerManager.findChannel(member.guild, dcGuild.channels.audit, ChannelType.GuildText) as TextChannel | undefined;
            //guildManager.findChannel<TextChannel>(dcGuild.channels.audit, ChannelType.GuildText);
            if (cAudit) {
                const emojiLevel = ServerManager.findEmoji(member.guild, `${type}Level`);
                const emojiCoins = ServerManager.findEmoji(member.guild, `coins`);

                const embed = new EmbedBuilder()
                .setColor(colors.systems.interaction as ColorResolvable)
                .setDescription(`${emojiLevel} ${member} subiu para o nível de ${type == "work" ? "trabalho" : "interação"} \`${newLevel}\` 
                Recompensa: ${emojiCoins} \`${coinsReward}\` moedas `)

                cAudit.send({content: `||${member}||`, embeds: [embed]});
            }
        }

        //playersColl.saveDocData(member.id, memberData);

        return true;
    }
}
