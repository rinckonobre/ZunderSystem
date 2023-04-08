import { ApplicationCommandType, codeBlock, EmbedBuilder, GuildMember, MessageContextMenuCommandInteraction, StringSelectMenuBuilder, TextChannel } from "discord.js";
import { config } from "../..";
import { toHexColor } from "../../functions/aplication/convert";
import { terms } from "../../jsons";
import { BreakInteraction, Command, DocumentPlayer, Firestore, ServerManager } from "../../structs";
import { ReplyBuilder } from "../../structs/classes/ReplyBuilder";

const playerColl = new Firestore("players");

export default new Command({
    name: "Alertar",
    type: ApplicationCommandType.Message,
    visibility: "staff",
    async run({ interaction, options }) {
        if (!(interaction instanceof MessageContextMenuCommandInteraction)) return;

        const member = interaction.member as GuildMember;
        const message = interaction.targetMessage;
        const mention = message.member;

        const cTerms = ServerManager.findChannel(interaction.guild!, config.guild.channels.terms) as TextChannel | undefined;

        const memberData = await playerColl.getDocData(member.id) as DocumentPlayer | undefined;
        if (!memberData || (memberData.registry?.level || 1) < 2) {
            new BreakInteraction(interaction, "Apenas staffs podem utilizar este comando!");
            return;
        }
        if (!mention) {
            new BreakInteraction(interaction, "O membro não foi encontrado no servidor!");
            return;
        }

        if (mention?.user.bot) {
            new BreakInteraction(interaction, "Não é possível alterar bots!");
            return;
        }


        let termsIndex: number;
        let termsCategory = terms[0];

        new ReplyBuilder(interaction, true)
            .addEmbed(
                new EmbedBuilder().setColor(toHexColor(config.colors.danger))
                    .setTitle(`Alertar ${mention?.displayName}`)
                    .setDescription(codeBlock(message.content.slice(0, 140) + "..."))
            )
            .setSelects(0, [
                new StringSelectMenuBuilder({
                    customId: "alert-category-select",
                    placeholder: "Selecione a categoria",
                    options: terms.map((category, index) => {
                        return {
                            label: category.title, value: index.toString(),
                            description: category.description.slice(0, 100), emoji: "📜"
                        };
                    })
                })
            ])
            .setSelectFunction(async (selectInteraction) => {

                function formatTerm(prefix: string, index: number) {
                    return `(${prefix}${(index + 1 < 10) ? `0${index + 1}` : index + 1})`;
                }
                termsIndex = parseInt(selectInteraction.values[0]);

                if (selectInteraction.customId == "alert-category-select") {
                    termsCategory = terms[termsIndex];

                    new ReplyBuilder(selectInteraction)
                        .setSelects(0, [new StringSelectMenuBuilder({
                            customId: "alert-term-select",
                            placeholder: "Selecione o termo",
                            options: termsCategory.terms.map((term, index) => {
                                return {
                                    label: formatTerm(termsCategory.prefix, index),
                                    value: index.toString(),
                                    description: term.slice(0, 100),
                                    emoji: "📃"
                                };
                            })
                        })])
                        .send(true);
                    return;
                }

                if (selectInteraction.customId == "alert-term-select") {

                    new ReplyBuilder(selectInteraction)
                        .setContent(`${mention} foi alertado(a) por descumprir o termo ${formatTerm(termsCategory.prefix, termsIndex)}`)
                        .send(true);

                    const embed = new EmbedBuilder()
                        .setColor(toHexColor(config.colors.danger))
                        .setDescription(`
                Olá ${mention}, você está sendo alertado por não 
                seguir os ${cTerms} da categoria **${termsCategory.title}**
    
                📃 **${formatTerm(termsCategory.prefix, termsIndex)}** *${termsCategory.terms[termsIndex]}*
                
                Leia os termos do grupo no chat ${cTerms}, caso descumprir
                algum termo novamente você receberá uma punição!`)
                        .setFields({
                            name: "\u200b", value: `
                ${message.channel}
                ${codeBlock(message.content.slice(0, 500))}
                `});

                    mention?.send({ embeds: [embed] }).catch(async () => {
                        const { channel } = interaction;
                        if (!(channel instanceof TextChannel)) return;

                        embed.setFields();
                        const msg = await channel.send({ embeds: [embed], content: `${mention}` });
                        setTimeout(() => msg?.delete().catch(() => { }), 50 * 1000);
                    });
                    return;
                }



            })
            .send();



    }
});