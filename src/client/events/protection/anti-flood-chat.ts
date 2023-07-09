import { ChannelType, Collection, EmbedBuilder, italic } from "discord.js";
import { Event } from "../../../app/base";
import { client, config } from "../../..";
import { findChannel, convertHex, wait } from "../../../app/functions";

const members: Collection<string, number> = new Collection();

export default new Event({name: "messageCreate", async run(message){

	if (message.channel.type !== ChannelType.GuildText || 
        !message.inGuild() || message.guild.id !== client.mainGuildId || 
        message.author.bot || !message.member
    ) return;
    
    const { member, guild } = message;
    
    if (member.id == guild.ownerId) return;
    
    const cGeneral = findChannel(guild, config.guild.channels.general, ChannelType.GuildText);
    const cTerms = findChannel(guild, config.guild.channels.terms);

    const count = members.get(member.id);
    if (!count){
        members.set(member.id, 1);
        return;
    }

    const newCount = count + 1;
    members.set(member.id, newCount);

    if (newCount > 4){
        members.delete(member.id);
        await message.channel.messages.fetch({limit: 50});
        const messages = message.channel.messages.cache.filter(m => m.author.id == member.id);
        message.channel.bulkDelete(messages.first(6));

        member.timeout(60*1000, "Flood de mensagens");

        cGeneral?.send({content: `||${member}||`, embeds: [new EmbedBuilder({
            color: convertHex(config.colors.theme.danger),
            description: `${member} evite o flood de mensagens nos chats por favor!
            > Leia os ${cTerms} do servidor para evitar punições
            ${italic("Você poderá enviar mensagens novamente em breve...")}`
        })]})
        .then(async message => {
            await wait(60*1000);
            message.delete().catch(console.log);
        });
        
        return;
    }

    setTimeout(() => {
        const currCount = members.get(member.id);
        if (!currCount) return;
        members.set(member.id, currCount - 1);
    }, 6000);
}});