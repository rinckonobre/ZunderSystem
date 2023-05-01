import { BreakInteraction, DocumentPlayer, client, db } from "@/app";
import { ActionRowBuilder, CommandInteraction, EmbedBuilder, GuildMember, StringSelectMenuBuilder } from "discord.js";
import { systemRegister } from "./system-register";
import { registries } from "@/config/jsons";
import { findEmoji } from "../discord/guild";

export const systemManager = {
    async member(interaction: CommandInteraction, mention: GuildMember, staff: {member: GuildMember, data: DocumentPlayer}){
        
        const { member, data: memberData } = staff;

        const mentionData = await db.players.get(mention.id) as DocumentPlayer | undefined;
        if (!mentionData){
            await systemRegister.create(mention);
            systemManager.member(interaction, mention, staff);
            return;
        }
                
        if (memberData.registry.level < 5 && mentionData.registry.level >= memberData.registry.level){
            new BreakInteraction(interaction, "Você não tem permissão para gerenciar um membro com o nível maior ou igual ao seu!");
            return;
        }

        const registry = registries[mentionData.registry.type].roles[mentionData.registry.level];

        const embed = new EmbedBuilder({
            title: "⚙️ Gerenciar membro",
            thumbnail: {url: mention.displayAvatarURL()},
            color: mention.displayColor,
            description: `> ${findEmoji(client, registry.emojiName)} ${mention.roles.highest} ${mention} 
            **${mention.user.tag}** \`${mention.id}\`
            Nível de registro: ${mentionData.registry.level} 
            Tipo: ${findEmoji(client, mentionData.registry.type)} ${mentionData.registry.type}
            Dispositivo: ${findEmoji(client, mentionData.registry.device)} ${mentionData.registry.device}
            Nick: \`${mentionData.registry.nick}\` 
            `,
            footer: {text: "Administração Zunder"}
        });

        const manageMemberSelect = new StringSelectMenuBuilder({
            customId: "manage-member-select",
            placeholder: "Escolha o que deseja gerenciar",
            options: [
                {label: "Editar nick", value: "edit-nick", description: "Editar nick do membro"},
                {label: "Encerrar registro", value: "close-registry", description: "Encerrar registro Zunder do membro"},
                {label: "Promover", value: "promote", description: "Promover membro para o cargo acima"},
                {label: "Rebaixar", value: "demote", description: "Rebaixar membro para o cargo abaixo"},
                {label: "Silenciamento", value: "mute", description: "Habilitar/Desabilitar microfone do membro"},
                {label: "Castigo", value: "timeout", description: "Aplicar/Remover castigo do membro"},
                {label: "Expulsar", value: "kick", description: "Expulsar membro do servidor"},
                {label: "Banir", value: "ban", description: "Banir membro do servidor"},
            ]
        });

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({components: [manageMemberSelect]});

        await interaction.reply({ephemeral: true, embeds: [embed], components: [row]});

        return;
    }
};