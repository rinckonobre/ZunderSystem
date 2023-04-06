import { ButtonInteraction, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder, Guild, GuildMember, UserContextMenuCommandInteraction } from "discord.js";
import { config } from "../..";
import { registers } from "../../jsons";
import { DocPlayer, ServerManager, TextUtils } from "../../structs";

function emoji(guild: Guild, name: string){
    return ServerManager.findEmoji(guild, name);
}

function setup(member: GuildMember, memberData: DocPlayer){
    const register = registers[memberData.registry!.type].find(r => r.level == memberData.registry!.level)!;

    return new EmbedBuilder()
    .setThumbnail(member.displayAvatarURL())
    .setColor(register.color as ColorResolvable)
    .setDescription(
    `> ${emoji(member.guild, register.emoji)} ${member.roles.highest} ${member}
    🏷️ Nick: \` ${memberData.registry!.nick} \`
    Tipo de registro: ${emoji(member.guild, memberData.registry!.type) || ""} ${memberData.registry!.type}
    Dispositivo: ${emoji(member.guild, memberData.registry!.device) || ""} ${memberData.registry!.device} `)
}

type CommandTypes = ChatInputCommandInteraction | UserContextMenuCommandInteraction | ButtonInteraction

export const systemProfile = {
    showMember(interaction: CommandTypes, member: GuildMember, memberData: DocPlayer){

        const embed = setup(member, memberData)
        const guild = member.guild

        const level = memberData.interaction?.level || 0;
        const xp = memberData.interaction?.xp || 0;
        const xpRequired = (level > 0) ? level * 982 : 440;

        const coins = memberData.wallet?.coins || 0;
        const coinsLimit = memberData.config?.limits?.coins || 20000;

        // ===========
        embed.addFields({name: "\u200b", inline: true, value: 
        `> ${emoji(guild, "interactionLevel")} Nível de interação: \` ${level} \`
        > ${emoji(guild, "interactionXp")} Experiência: \` ${xp} / ${xpRequired} \` 
        > ${TextUtils.progressBar(xp, xpRequired)} **${TextUtils.progresPercentage(xp, xpRequired).toFixed(0)}%** 
        `})
        // Moedas;
        .addFields({name: "\u200b", inline: true, value: 
        `> ${emoji(guild, "coins")} Moedas: \` ${coins}/${coinsLimit} \`
        > \u200b
        `})
        // Statistics
        .addFields({name: "\u200b", value: 
        `📁 Recursos postados: ${memberData.resources?.length || 0}
        ✉️ Mensagens enviadas: ${memberData.stats?.msg || 0}
        🎉 Eventos:  ${memberData.stats?.events || 0} `})
        // ===========
        const roleShare = ServerManager.findRole(guild, config.dcGuild.roles.functional.share)!
        const roleSupporter = ServerManager.findRole(guild, config.dcGuild.roles.functional.supporter)!

        if (member.roles.cache.has(roleSupporter.id)) {
            embed.addFields({ name: "Apoiador(a) Zunder", inline: true, value: 
            `> ${emoji(guild, "supporter")} Valor total: ${memberData.stats?.donated || 0} reais
            `})
        }
        if (member.roles.cache.has(roleShare.id)) {
            embed.addFields({ name: "🔗 Compartilhamento", inline: true, value: 
            `> Total de postagens: ${memberData.stats?.shares || 0}
            `})
        }
        // ===========

        if (interaction instanceof ButtonInteraction) {
            interaction.update({embeds: [embed]})
        } else {
            interaction.reply({ephemeral: true, embeds: [embed]})
        }
    }
}