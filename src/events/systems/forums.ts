import { config } from "../..";
import { Event } from "../../structs";

export default new Event({
    name: "threadCreate",
    async run(thread) {
        const cSuggests = thread.guild.channels.cache.find(c => c.name == config.dcGuild.channels.suggests);
        const message = await thread.fetchStarterMessage();
        if (cSuggests) {
            if (message && thread.parentId == cSuggests.id){
                message.react("👍")
                message.react("👎")
            }
        };
    },
})
