import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, GuildMember, StringSelectMenuBuilder } from "discord.js";
import { config, db } from "../..";
import { systemRecords } from "../../functions";
import { BreakInteraction, Command, DiscordTools, DocPlayer, ServerManager } from "../../structs";

export default new Command({
    name: "Member Tools",
    nameLocalizations: {"pt-BR": "👤 Ferramentas de membro"},
    type: ApplicationCommandType.User,
    visibility: "staff",
    async run({interaction}) {
        if (!interaction.isUserContextMenuCommand()) return;

        const guild = interaction.guild!;

        const member = interaction.member as GuildMember;
        const target = interaction.targetMember as GuildMember;

        if (target.user.bot){
            new BreakInteraction(interaction, "Não é possível utilizar as ferramentas de membro com bots!");
            return;
        }

        const memberData: DocPlayer | undefined = await db.players.get(member.id);
        if (!memberData || !memberData.registry){
            new BreakInteraction(interaction, "Apenas staffs podem usar este comando!")
            return;
        }

        const rowTools = new ActionRowBuilder<StringSelectMenuBuilder>({components: [
            new StringSelectMenuBuilder({customId: "member-tools-select", placeholder: "Selecione o que deseja fazer", options: [
                {label: "Compartilhamento", value: "share", description: "Definir/Remover tag compartilhamento", emoji: "🔁"},
            ]})
        ]})

        // Cargos
        const roleShare = ServerManager.findRole(guild, config.dcGuild.roles.functional.share);

        //

        let selectedTool: MemberTool;

        const msg = await interaction.reply({ephemeral: true, components: [rowTools], fetchReply: true});

        DiscordTools.selectCollector({source: msg, async collect(subInteraction){
            selectedTool = subInteraction.values[0] as MemberTool;

            const confirmButton = new ButtonBuilder({customId: "confirm-button", label: "Confirmar", style: ButtonStyle.Success})
            
            switch (selectedTool) {
                case "share":{
                    if (!roleShare) {
                        new BreakInteraction(interaction, "O cargo de compartilhamento não foi configurado!", {replace: true});
                        return;
                    };

                    const action = (target.roles.cache.has(roleShare.id)) ? "remover" : "adicionar";
                    const embed = new EmbedBuilder()
                    .setColor(config.colors.systems.share as ColorResolvable)
                    .setDescription(`Deseja ${action} a tag ${roleShare} ${action == "adicionar" ? "a" : "de"} ${target}?`);

                    subInteraction.update({
                        embeds: [embed],
                        components: [DiscordTools.createRowButtons(confirmButton)]
                    })

                    return;
                }
            }
        }})
        DiscordTools.buttonCollector({source: msg, async collect(subInteraction) {
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
                        title: config.dcGuild.roles.functional.share, color: config.colors.systems.share, style: "FULL" }, 
                        staff: member, mention: target, details: `> ${target.roles.highest} ${target}
                        ${action == "adicionar"? "Recebeu" : "Perdeu"} tag ${roleShare}`
                    })
                    return;
                }
            }

            
        }})

    },
})

// Command config
type MemberTool = "share"