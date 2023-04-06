import { EmbedBuilder, ButtonInteraction, Colors, CommandInteraction, ContextMenuCommandInteraction, GuildMember, Interaction, Message, ModalSubmitInteraction, StringSelectMenuInteraction, StageChannel } from "discord.js";

type interactionTypes = CommandInteraction | ContextMenuCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction | Message

export class Interruption{
    constructor(interaction: interactionTypes | Message, text: string){
        const member = interaction.member as GuildMember

        const embed = new EmbedBuilder()
        .setFooter({text: "Feche isto clicando em ignorar mensagem", iconURL: member.displayAvatarURL()})
        .setDescription(`> ${text}`)
        .setColor(Colors.Red)

        if (interaction instanceof Message) {
            embed.setFooter({text: member.displayName, iconURL: member.displayAvatarURL()})
            const c = interaction.channel;
            interaction.delete().catch(() => {});
            
            if (c instanceof StageChannel) return;

            c.send({embeds: [embed], content: `||${member}||`})
            .then(m => {
                setTimeout(() => m.delete().catch(() => {}), 8*1000);
            })
            return;
        }
        if (
            interaction instanceof StringSelectMenuInteraction || 
            interaction instanceof ButtonInteraction ) {
                interaction.reply({ephemeral: true, embeds: [embed]})
            return;
        }
        if (interaction instanceof ModalSubmitInteraction || 
            interaction instanceof ContextMenuCommandInteraction ||
            interaction instanceof CommandInteraction ) {
                interaction.reply({ephemeral: true, embeds: [embed]})
                return;
            }

    }
}

export class TextUtils {
    public static progressBar(currXp: number, requiredXp: number){
        const percentage = TextUtils.progresPercentage(currXp, requiredXp);
        const filledSquares = Math.floor(percentage / 10);
        const emptySquares = 10 - filledSquares;
        return `${'◈'.repeat(filledSquares)}${'◇'.repeat(emptySquares)}`;
    }
    public static progresPercentage(currXp: number, requiredXp: number){ return (currXp / requiredXp) * 100 }
    public static captalize(word: string) { return word.charAt(0).toUpperCase() + word.slice(1) }
    public static jsonParse(text: string){ 
        try {
            return `${JSON.parse(JSON.stringify(text))}`
        } catch (err) {
            return undefined;
        }
    }
    public static evalString(text: string){
        try {
            return eval(text) as string
        }
        catch (err) {
            return undefined;
        }
    }
}

export class NumberUtils {
    public static random(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}