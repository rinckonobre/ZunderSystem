
import { ChannelType } from "discord.js";
import { Event } from "../../../app/base";
import { client, config } from "../../..";

export default new Event({
    name: "messageCreate",
    async run(message){
        const { channel, guild, member } = message;

        if (channel.type != ChannelType.GuildText ||
            channel.name != config.guild.channels.instaplay ||
            !guild || guild.id != client.mainGuildId ||
            !member || member.user.bot
        ) return;
        
        const { attachments } = message;
    
        if (attachments.size != 1) {
            message.delete().catch(console.log);
            return;
        }
    
        await message.react("❤️").catch(console.log);
        await message.react("💩").catch(console.log);
    }
});