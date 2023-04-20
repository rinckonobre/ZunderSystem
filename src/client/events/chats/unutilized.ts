import { EmbedBuilder } from "discord.js";
import { Event } from "../../../app/structs";
import { config } from "../../../app";
import { toHexColor, wait } from "../../../app/functions";

export default new Event({
    name: "messageCreate",
    async run(message) {
        if (!message.inGuild()) return;
        const { member, channel, guild } = message;
        
        if (member?.user.bot) return;

        if (channel.parent?.name.toLowerCase() != "unutilized") return;
        if (!member) return;
        const cRegister = guild.channels.cache.find(c => c.name == config.guild.channels.register);

        const embed = new EmbedBuilder({
            author: {name: member.displayName, iconURL: member.displayAvatarURL()},
            color: toHexColor(config.colors.danger),
            description: `Olá ${member}. Este chat não pode ser utilizado! \nSe registre usando o chat ${cRegister} por favor`
        })

        message.delete()
        .catch(() => {});
        
        const msg = await channel.send({embeds: [embed], content: `||${member}||`})
        await wait(30_000);
        
        msg.delete()
        .catch(() => {});
    },
})