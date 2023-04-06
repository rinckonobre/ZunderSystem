import { Event } from "../../structs";

export default new Event({
    name: "messageCreate",
    run(message) {
        const client = message.client;
        if (message.member?.user.bot) return;
        if (!message.mentions.users.has(client.user.id)) return;
    
        message.reply({content: "O que posso ajudar?"})
    },
})