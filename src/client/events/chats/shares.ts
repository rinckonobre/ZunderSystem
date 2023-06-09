import { ChannelType } from "discord.js";
import { Event } from "../../../app/base";
import { client, db, config } from "../../..";
import { BreakInteraction } from "../../../app/classes";
import { DocumentPlayer } from "../../../app/interfaces";

export default new Event({name: "messageCreate", async run(message){
    if (message.channel.type != ChannelType.GuildText ||
        message.channel.name != config.guild.channels.shares ||
        message.guild?.id != client.mainGuildId ||
        !message.member || message.member.user.bot
    ) return;
    
    const { content, attachments, member } = message;

    const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
    if (!memberData) {
        new BreakInteraction(message, "Apenas membros registrados podem divulgar conteúdos aqui!");
        return;
    }

    if (attachments.size > 1) 
    return new BreakInteraction(message, "Envie no máximo uma imagem por mensagem!");

    if (content.includes("<@") || content.includes("<#"))
    return new BreakInteraction(message, "Não mencione cargos ou membros aqui!");
    
    if (message.content.length < 20) 
    return new BreakInteraction(message, "Sua mensagem é muito pequena!");

    if (memberData.stats) {
        const currShares = memberData.stats.shares || 1;
        memberData.stats.shares = currShares + 1;
    } else {
        memberData.stats = {
            shares: 1
        };
    }

    await message.react("👍");
    await message.react("👎");
    await message.react("❗");
}});