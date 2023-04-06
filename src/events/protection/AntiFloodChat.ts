import { ChannelType, GuildMember, TextChannel } from "discord.js";
import { client, config } from "../..";
import { DiscordCreate, Event, GuildManager, MemberCooldowns } from "../../structs";

export default new Event({name: 'messageCreate', async run(message){

	if (message.channel.type !== ChannelType.GuildText
        || message.guild!.id !== client.mainGuildID
        || message.author.bot)
    return;
    
    const member = message.member as GuildMember
    const guildManager = new GuildManager(message.guild!);

    if (member.id == guildManager.guild.ownerId) return;
    
    const cGeneral = guildManager.findChannel<TextChannel>(config.guild.channels.general, ChannelType.GuildText);
    const cTerms = guildManager.findChannel<TextChannel>(config.guild.channels.terms, ChannelType.GuildText);

    const times = MemberCooldowns.AntiFloodChat.get(member)
    if (!times) {
        MemberCooldowns.AntiFloodChat.set(member, 1)
    } else {

        MemberCooldowns.AntiFloodChat.set(member, times + 1)

        if (times + 1 > 4) {
            MemberCooldowns.AntiFloodChat.delete(member);
            const messages = message.channel.messages.cache.filter(m => m.author.id === member.id)
            message.channel.bulkDelete(messages.first(6))

            const embed = DiscordCreate.simpleEmbed(config.colors.danger, `${member} evite o flood de mensagens nos chats por favor!
            > Leia os ${cTerms} do grupo
            
            _Você poderá enviar mensagens novamente em breve..._ `);

            member.timeout(60*1000);

            cGeneral?.send({content: `||${member}||`,embeds: [embed]}).then((msg) => {
                setTimeout(() => {

                    msg.delete().catch(() => {});

                }, 60*1000);
            })
            
            return;
        }

        setTimeout(() => {
            MemberCooldowns.AntiFloodChat.set(member, times - 1);
        }, 6000);
    }
}})

// const member = message.member as GuildMember
//     const guild = message.guild!

//     if (member.id === IDs.owner) return
    
//     let value = client.AntiFloodChat.get(member.id) || 0

//     if (value > 3) {

//         client.AntiFloodChat.delete(member.id);

//         member.timeout(60000)

//         const messages = message.channel.messages.cache.filter(m => m.author.id === member.id)
//         message.channel.bulkDelete(messages.first(6))

//         const cTerms = manage.channels(guild).find('📜termos')!

//         const embed = new EmbedBuilder()
//         .setColor(config.colors.danger as ColorResolvable)
//         .setDescription(`
//         ${member} evite o flood de mensagens nos chats por favor!
//         > Leia os ${cTerms} do grupo
        
//         _Você poderá enviar mensagens novamente em breve..._ `)

//         const msg = await message.channel.send({embeds: [embed], content: `||${member}||`})
        
//         await wait(40000)
//         msg.delete().catch(() => {})
        
//         return
//     }

//     if (!value) client.AntiFloodChat.set(member.id, 0)
    
//     value = client.AntiFloodChat.get(member.id) || 0
//     client.AntiFloodChat.set(member.id, (value + 1))

//     await wait(5000)
//     client.AntiFloodChat.delete(member.id)