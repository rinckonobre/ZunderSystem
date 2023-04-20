import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, StringSelectMenuBuilder } from "discord.js";
import { toHexColor, awaitButton, wait, logger } from "../../../app/functions";
import { Command } from "../../../app/structs";
import { config } from "../../../app";

export default new Command({
    name: "minigame",
    description: "minigame command",
    descriptionLocalizations: {"pt-BR": "Comando de minigames"},
    type: ApplicationCommandType.ChatInput,
    visibility: "public",
    options: [
        {
            name: "jokenpo",
            description: "Jokenpô Minigame",
            descriptionLocalizations: {"pt-BR": "Minigame Jokenpô"},
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "challange",
                    nameLocalizations: {"pt-BR": "desafiar"},
                    description: "Challange a member",
                    descriptionLocalizations: {"pt-BR": "Desafiar um membro"},
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "member",
                            nameLocalizations: {"pt-BR": "membro"},
                            description:  "Mention a member",
                            descriptionLocalizations: {"pt-BR": "Mencione um membro"},
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "rounds",
                            nameLocalizations: {"pt-BR": "rodadas"},
                            description:  "Amount of rounds",
                            descriptionLocalizations: {"pt-BR": "Quantidade de rodadas"},
                            type: ApplicationCommandOptionType.Number,
                            required: true,
                            choices: [
                                {name: "[1]", value: 1},
                                {name: "[3]", value: 3},
                                {name: "[5]", value: 5},
                                {name: "[8]", value: 8},
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { guild, member, channel } = interaction;

        const rows = [
            new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>(),
        ]

        const buttons = {
            accept: new ButtonBuilder({customId: "minigame-accept-button", label: "Aceitar", style: ButtonStyle.Success}),
            recuse: new ButtonBuilder({customId: "minigame-recuse-button", label: "Recusar", style: ButtonStyle.Danger})
        }

        switch (options.getSubcommandGroup(true)){
            case "jokenpo":{

                switch (options.getSubcommand(true)){
                    case "challange":{
                        const mention = options.getMember("member") as GuildMember;
                        const rounds = options.getNumber("rounds", true);
                        const time = 30 * 1000;

                        const embed = new EmbedBuilder({
                            title: "Jokenpô", color: toHexColor(config.colors.primary),
                            description: `**${member.displayName}** está desafiando **${mention.displayName}** para
                            um duelo de \`${rounds} rodadas\` no Jokenpô 🪨📄✂️
                            
                            ${mention} tem ${time / 1000} segundos para aceitar...`,
                            thumbnail: { url: member.displayAvatarURL() }
                        })

                        rows[0].setComponents(buttons.accept, buttons.recuse);
                        const message = await interaction.reply({
                            content: `||${mention}||`, embeds: [embed], 
                            components: [rows[0]], fetchReply: true,
                        })

                        const buttonResponse = await awaitButton(message, {time, filter(subInteraction){
                            subInteraction.deferUpdate();
                            return subInteraction.user.id == mention.id;
                        }});

                        if (!buttonResponse){
                            embed.setColor(toHexColor(config.colors.danger))
                            .setDescription(`O tempo para que ${mention} aceitasse o desafio se esgotou!`)
                            
                            interaction.editReply({embeds: [embed], components: []})
                            .then(async (message) => {
                                await wait(time);
                                message.delete().catch(logger);
                            })
                            return;
                        }

                        if (buttonResponse.customId == "minigame-recuse-button"){
                            embed.setColor(toHexColor(config.colors.danger))
                            .setDescription(`${mention} arregou para o desafio Jokenpô de ${member}!`)

                            interaction.editReply({embeds: [embed], components: []})
                            .then(async (message) => {
                                await wait(time);
                                message.delete().catch(logger);
                            })
                            return;
                        }

                        const minigameButtons = {
                            rock: new ButtonBuilder({customId: "jokenpo-rock-button", label: "Pedra", emoji: "🪨", style: ButtonStyle.Secondary}),
                            paper: new ButtonBuilder({customId: "jokenpo-paper-button", label: "Papel", emoji: "📄", style: ButtonStyle.Secondary}),
                            scissors: new ButtonBuilder({customId: "jokenpo-scissors-button", label: "Tesoura", emoji: "✂️", style: ButtonStyle.Secondary})
                        }

                        rows[0].setComponents(minigameButtons.rock, minigameButtons.paper, minigameButtons.scissors)
                        interaction.editReply({embeds: [embed], components: [rows[0]]})

                        

                        return;
                    }
                }
                return;
            }
        }

    },
})

// Command config

interface JokenpoPlayer { 
    choose: boolean;
    object: JokenpoObject;
    roundWins: number;
}
type JokenpoObject = "rock" | "paper" | "scissors"