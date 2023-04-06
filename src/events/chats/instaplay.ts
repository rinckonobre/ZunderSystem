import { ChannelType } from "discord.js";
import { client, config } from "../..";
import { logger } from "../../functions";
import { Event } from "../../structs";

export default new Event({
    name: "messageCreate",
    async run(message){
        const { channel, guild, member } = message;
        if (channel.type != ChannelType.GuildText ||
            channel.name != config.guild.channels.instaplay ||
            !guild || guild.id != client.mainGuildID ||
            !member || member.user.bot
        ) return;
        
        const { attachments } = message;
    
        if (attachments.size != 1) {
            message.delete().catch(logger)
            return;
        }
    
        await message.react("❤️").catch(logger)
        await message.react("💩").catch(logger)
    }
})