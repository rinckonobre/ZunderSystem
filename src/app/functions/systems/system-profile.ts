import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, GuildMember, codeBlock } from "discord.js";
import { registries } from "../../../settings/jsons";
import { DocumentPlayer } from "../../interfaces";
import { logger } from "../app/logger";
import { findEmoji, findRole } from "../discord/guild";
import { config } from "../../..";


export const systemProfile = {
    async showMember(interaction: CommandInteraction, member: GuildMember, memberData: DocumentPlayer){
        const { client } = interaction;
        const { guild } = member;
        const { registry, config: memberConfig } = memberData;
        const register = registries[registry.type].roles[registry.level];

        const [level, xp] = [memberData.interaction?.level ?? 0, memberData.interaction?.xp ?? 0 ];
        const xpRequired = (level > 0) ? level * 982 : 440;

        const coins = memberData.wallet?.coins ?? 0;
        const coinsLimit = memberConfig?.limits?.coins ?? 20000;

        const [ donated, msgs, events, shares ] = [
            memberData.stats?.donated ?? 0,
            memberData.stats?.msg ?? 0,
            memberData.stats?.events ?? 0,
            memberData.stats?.shares ?? 0,
        ];

        const resources = memberData.resources?.length ?? 0;

        const about = memberConfig?.profile?.about || "Este é o meu sobre mim. Mais tarde eu altero...";

        const emojis = {
            registryIcon: findEmoji(client, register.emojiName),
            registryType: findEmoji(client, registry.type),
            registryDevice: findEmoji(client, registry.device),
            level: findEmoji(client, "interactionLevel"),
            xp: findEmoji(client, "interactionXp"),
            coins: findEmoji(client, "coins"),
            supporter: findEmoji(client, "supporter"),
        };

        const embed = new EmbedBuilder({
            author: { 
                name: `Perfil de ${member.displayName}`, 
                iconURL: member.displayAvatarURL() 
            },
            description: about,
            thumbnail: {url: member.displayAvatarURL() },
            color: member.displayColor,
            fields: [
                { name: "\u200b", value: `>>> ${emojis.registryIcon} ${member.roles.highest} ${member}
                🏷️ Nick \`${registry.nick}\``, inline: true },
                { name: "\u200b", value: `Registro: ${emojis.registryType} ${registry.type}
                Dispositivo: ${emojis.registryDevice} ${registry.device}`, inline: true },
                { name: "\u200b", value: "\u200b", inline: true },
                
                { name: "\u200b", value: `>>> ${emojis.level} Nível de interação: \` ${level} \`
                ${emojis.xp} Xp: \` ${xp} / ${xpRequired} \``, inline: true },
                { name: "\u200b", value: `>>> ${emojis.coins} Moedas: \n\` ${coins} / ${coinsLimit} \``, inline: true},
                
                { name: "\u200b", value: `✉️ Mensagens enviadas: ${msgs}
                🎉 Eventos participados: ${events}
                📁 Recursos postados: ${resources}`, inline: false },
            ],
            footer: {text: interaction.user.id }
        });

        const shareRole = findRole(guild, config.guild.roles.functional.share);
        const supporterRole = findRole(guild, config.guild.roles.functional.supporter);
        
        if (supporterRole && member.roles.cache.has(supporterRole.id)){
            embed.addFields({name: "Contribuição Zunder", value: `${emojis.supporter} Valor total: ${donated}`, inline: true });
        }
        if (shareRole && member.roles.cache.has(shareRole.id)){
            embed.addFields({name: "Compartilhamento", value: `Postagens: ${shares}`, inline: true });
        }

        const buttons = {
            config: new ButtonBuilder({customId: "profile-config-button", emoji: "🔧", style: ButtonStyle.Secondary}),
            close: new ButtonBuilder({customId: "profile-close-button", label: "Fechar", style: ButtonStyle.Danger})
        };
        
        if (member.id !== interaction.user.id) buttons.config.setDisabled(true);

        const row = new ActionRowBuilder<ButtonBuilder>({components: [buttons.config, buttons.close]});

        const message = await interaction.reply({embeds: [embed], components: [row], fetchReply: true});
        setTimeout(() => {
            message.delete().catch(logger);
        }, 60 * 2 * 1000);
    }
};