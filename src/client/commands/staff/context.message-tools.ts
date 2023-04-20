import { ActionRowBuilder, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder } from "discord.js";
import { db } from "../../../app";
import { stringSelectCollector, awaitButton } from "../../../app/functions";
import { Command, DocumentPlayer, BreakInteraction } from "../../../app/structs";

export default new Command({
    name: "Message Tools", nameLocalizations: {"pt-BR": "📩 Ferramentas de mensagem"},
    type: ApplicationCommandType.Message,
    visibility: "staff",
    async run({interaction}) {
        if (!interaction.isMessageContextMenuCommand() || !interaction.inCachedGuild()) return;
        const { member, targetMessage, guild, channel } = interaction;

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData || !memberData.registry || memberData.registry.level < 3){
            new BreakInteraction(interaction, "Apenas Mods e superiores podem usar este comando!");
            return;
        }

        const rows = [
            new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>(),
            new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>()
        ]

        const buttons = {
            confirm: new ButtonBuilder({customId: "message-tools-confirm-button", label: "Confirmar", style: ButtonStyle.Success}),
            cancel: new ButtonBuilder({customId: "message-tools-cancel-button", label: "Cancelar", style: ButtonStyle.Danger}),
        }

        const messageToolsSelect = new StringSelectMenuBuilder({
            customId: "message-tools-select",
            placeholder: "Selecione o que fazer a mensagem",
            options: [
                {label: "Deletar", value: "delete", description: "Deletar a mensagem", emoji: "🗑️"},
                {label: "Alertar", value: "alert", description: "Alterar membro usando a mensagem", emoji: "🚨"},
                {label: "Json", value: "json", description: "Converter conteúdo em json", emoji: "📄"},
            ]
        })
        rows[0].setComponents(messageToolsSelect);
        const msg = await interaction.reply({ephemeral: true, components: [rows[0]], fetchReply: true});

        stringSelectCollector(msg).on("collect", async (subInteraction) => {
            const selected = subInteraction.values[0];

            switch(selected){
                case "delete":{
                    rows[0].setComponents(buttons.confirm, buttons.cancel);

                    const msg = await subInteraction.update({components: [rows[0]] });

                    const buttonInteraction = await awaitButton(msg);
                    if (buttonInteraction?.customId == "message-tools-confirm-button"){
                        const success = await targetMessage.delete().then(() => true).catch(() => false);
                        
                        if (success) subInteraction.editReply({components: [], content: "A mensagem foi excluída!"});
                        else subInteraction.editReply({components: [], content: "Não foi possível excluir a mensagem!"});
                    } else {
                        subInteraction.deleteReply();
                    }
                    return;
                }
                case "json":{
                    const { content, embeds } = targetMessage;
                    
                    const files: Array<AttachmentBuilder> = new Array();
                    
                    if (content.length > 0) 
                    files.push(new AttachmentBuilder(Buffer.from(content, "utf-8"), {name: "content.json"}));
                    
                    if (embeds && embeds.length > 0)
                    embeds.forEach((embed, index) => {
                        const fileName = `embed-${index}`;
                        const data = JSON.stringify(embed, null, 2);
                        files.push(new AttachmentBuilder(Buffer.from(data, "utf-8"), {name: fileName + ".json"}));
                    })

                    subInteraction.reply({ephemeral: true, content: "Arquivos", files})
                    return;
                }
            }
        })
    },
})