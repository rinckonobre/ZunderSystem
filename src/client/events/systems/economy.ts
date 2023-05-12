import { ChannelType, Collection, GuildMember } from "discord.js";
import { client, db } from "../../..";
import { Event } from "../../../app/base";
import { randomNumber, systemCoins, systemExperience, wait } from "../../../app/functions";
import { DocumentPlayer } from "../../../app/interfaces";

const members: Collection<string, boolean> = new Collection();

export default new Event({
    name: "messageCreate", async run(message) {
        if (message.channel.type != ChannelType.GuildText ||
            message.guild?.id != client.mainGuildID ||
            !message.member || message.member.user.bot
        ) return;

        const member = message.member as GuildMember;

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData) return;

        db.players.update(member.id, "stats.msg", 1, "increment");

        if (members.has(member.id)) return;
        // if (MemberCooldowns.Economy.get(member)) return;
        const randomXp = randomNumber(1, 8);//NumberUtils.random(1, 8);
        const randomCoins = randomNumber(1, 4); //NumberUtils.random(1, 4);

        await systemCoins.give(member, randomCoins);
        members.set(member.id, true);
        // MemberCooldowns.Economy.set(member, 1);

        await wait(5000);

        systemExperience.give(member, randomXp, "interaction");
        members.delete(member.id);
        // MemberCooldowns.Economy.delete(member);

    }
});