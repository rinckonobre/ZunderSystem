import { ChannelType } from "discord.js";
import { config } from "../../..";
import { Event } from "../../../app/base";
import { findChannel } from "../../../app/functions";

export default new Event({
    name: "threadCreate",
    async run(thread) {
        const cSuggests = findChannel(thread.guild, config.guild.channels.suggests, ChannelType.GuildForum);
        //thread.guild.channels.cache.find(c => c.name == config.guild.channels.suggests);
        const message = await thread.fetchStarterMessage();
        if (cSuggests && message && thread.parentId == cSuggests.id) {
            message.react("👍");
            message.react("👎");
        }
    }
});

