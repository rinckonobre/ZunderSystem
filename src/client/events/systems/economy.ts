import { ChannelType, GuildMember } from "discord.js";
import { Event } from "../../../app/base";
import { client, db } from "../../..";
import { NumberUtils } from "../../../app/classes";
import { systemCoins, wait, systemExperience } from "../../../app/functions";
import { DocumentPlayer } from "../../../app/interfaces";
import { MemberCooldowns } from "../../../app/manager";

export default new Event({
    name: "messageCreate", async run(message) {
        if (message.channel.type != ChannelType.GuildText ||
            message.guild?.id != client.mainGuildID ||
            !message.member || message.member.user.bot
        ) return;

        const member = message.member as GuildMember;

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData?.registry) return;

        db.players.update(member.id, "stats.msg", 1, "increment");

        if (MemberCooldowns.Economy.get(member)) return;

        const randomXp = NumberUtils.random(1, 8);
        const randomCoins = NumberUtils.random(1, 4);

        await systemCoins.give(member, randomCoins);
        MemberCooldowns.Economy.set(member, 1);

        await wait(5000);

        systemExperience.give(member, randomXp, "interaction");
        MemberCooldowns.Economy.delete(member);

    }
});