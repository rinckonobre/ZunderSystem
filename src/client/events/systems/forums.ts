import { config } from "../../../app";
import { Event } from "../../../app/structs";


export default new Event({
    name: "threadCreate",
    async run(thread) {
        const cSuggests = thread.guild.channels.cache.find(c => c.name == config.guild.channels.suggests);
        const message = await thread.fetchStarterMessage();
        if (cSuggests) {
            if (message && thread.parentId == cSuggests.id){
                message.react("👍")
                message.react("👎")
            }
        };
    },
})

