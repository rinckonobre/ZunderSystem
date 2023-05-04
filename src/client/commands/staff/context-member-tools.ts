import { Command, config, db, DocumentPlayer } from "@/app";
import { BreakInteraction, DiscordTools } from "@/app/classes";
import { findRole, stringSelectCollector, buttonCollector, systemRecords } from "@/app/functions";
import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";

export default new Command({
    name: "Member Tools",
    nameLocalizations: {"pt-BR": "👤 Ferramentas de membro"},
    type: ApplicationCommandType.User,
    visibility: "staff",
    async run({interaction}) {
        if (!interaction.isUserContextMenuCommand() || !interaction.inCachedGuild()) return;

        const { member, guild, targetMember: target } = interaction;

        if (target.user.bot){
            new BreakInteraction(interaction, "Não é possível utilizar as ferramentas de membro com bots!");
            return;
        }

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData || !memberData.registry){
            new BreakInteraction(interaction, "Apenas staffs podem usar este comando!");
            return;
        }

        const rows = [
            new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>()
        ];

        const selectTools = new StringSelectMenuBuilder({
            customId: "member-tools-select", placeholder: "Selecione o que deseja fazer", 
            options: [
                {
                    label: "Compartilhamento", value: "share", emoji: "🔁",
                    description: "Definir/Remover tag compartilhamento", 
                },
            ]
        });

        rows[0].setComponents(selectTools);

        // Cargos
        const roleShare = findRole(guild, config.guild.roles.functional.share);

        //

        let selectedTool: MemberTool;

        const message = await interaction.reply({ephemeral: true, components: [rows[0]], fetchReply: true});

        stringSelectCollector(message).on("collect", async (subInteraction) => {
            selectedTool = subInteraction.values[0] as MemberTool;

            const confirmButton = new ButtonBuilder({customId: "confirm-button", label: "Confirmar", style: ButtonStyle.Success});
            
            switch (selectedTool) {
                case "share":{
                    if (!roleShare) {
                        new BreakInteraction(interaction, "O cargo de compartilhamento não foi configurado!", {replace: true});
                        return;
                    }

                    const action = (target.roles.cache.has(roleShare.id)) ? "remover" : "adicionar";
                    const embed = new EmbedBuilder()
                    .setColor(config.colors.systems.share as ColorResolvable)
                    .setDescription(`Deseja ${action} a tag ${roleShare} ${action == "adicionar" ? "a" : "de"} ${target}?`);

                    subInteraction.update({
                        embeds: [embed],
                        components: [DiscordTools.createRowButtons(confirmButton)]
                    });

                    return;
                }
            }
        });

        buttonCollector(message).on("collect", async (subInteraction) => {
            const { customId } = subInteraction;

            switch (selectedTool){
                case "share":{
                    const action = (target.roles.cache.has(roleShare!.id)) ? "remover" : "adicionar";

                    const embed = new EmbedBuilder()
                    .setDescription(`Tag ${roleShare} ${action == "adicionar"? "adicionada a" : "removida de"} ${target}`);
                    
                    subInteraction.update({embeds: [embed], components: []});

                    if (action == "adicionar") target.roles.add(roleShare!);
                    else target.roles.remove(roleShare!);
    
                    systemRecords.send(guild, { system: {
                        title: config.guild.roles.functional.share, color: config.colors.systems.share, style: "FULL" }, 
                        staff: member, mention: target, details: `> ${target.roles.highest} ${target}
                        ${action == "adicionar"? "Recebeu" : "Perdeu"} tag ${roleShare}`
                    });
                    return;
                }
            }
        });

    },
});

// Command config
type MemberTool = "share"