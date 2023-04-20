import { ChannelType } from "discord.js";
import { BreakInteraction, DocumentPlayer, Event, Firestore, ServerManager } from "../../../app/structs";
import { client, config } from "../../../app";
import { systemRegister, systemRecords } from "../../../app/functions";
import { registers } from "../../../config/jsons";

const playerColl = new Firestore("players");

const blackListChars = [
    "@", "/", "*", "-", "&", "!", "<", ">", "#",
    ":", ";", "(", ")", "$", "%", "`", "[", "]", "+",
    "=",
]

export default new Event({
    name: "messageCreate", 
    async run(message){
        if (message.channel.type != ChannelType.GuildText ||
            message.channel.name != config.guild.channels.register ||
            message.guild?.id != client.mainGuildID ||
            !message.member || message.member.user.bot
        ) return;
        
        const { guild, member, content } = message;

        if (content.includes(" ")) {
            new BreakInteraction(message, "Digite seu nick sem espaços");
            return;
        }
        
        if (!guild){
            new BreakInteraction(message, "Guilda não encontrada!");
            return;
        }

        for (const char of blackListChars) {
            if (content.includes(char)) {
                new BreakInteraction(message, `Não utilize caracteres especiais para se registrar!
                O nick que você enviou contém \`${char}\` `)
                return;
            }
        }

        message.delete().catch(() => {})

        const memberData = await playerColl.getDocData(member.id) as DocumentPlayer | undefined;
        if (memberData && memberData.registry) {
            client.emit("guildMemberAdd", member);
            return;
        }

        systemRegister.create(member, content);

        const memberRole = ServerManager.findRole(guild, registers.discord.find(r => r.level == 1)!.name);
        if (memberRole && !member.roles.cache.has(memberRole.id)) member.roles.add(memberRole);

        systemRecords.send(guild, {
            system: {
                title: "📝 Registro", color: config.colors.primary, style: "SIMPLE"
            },
            details: `Novo membro registrado: ${member} **${member.user.tag}**
            Nick: \`${content}\``,
            mention: member,
            staff: client,
        })
    }
})