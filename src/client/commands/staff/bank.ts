import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, GuildMember } from "discord.js";
import { client, db, config } from "../../..";
import { Command } from "../../../app/base";
import { BreakInteraction } from "../../../app/classes";
import { convertHex, buttonCollector } from "../../../app/functions";
import { DocumentPlayer, DocumentGuild } from "../../../app/interfaces";

const ephemeral = true;

export default new Command({
    name: "bank", nameLocalizations: {"pt-BR": "banco"},
    description: "Manages Zunder's bank",
    descriptionLocalizations: {"pt-BR": "Administra o banco da Zunder"},
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "add", nameLocalizations: {"pt-BR": "adicionar"},
            description: "Adds a value to the bank",
            descriptionLocalizations: {"pt-BR": "Adiciona um valor ao banco"},
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "member", nameLocalizations: {"pt-BR": "membro"},
                    description: "Member who made the donation",
                    descriptionLocalizations: {"pt-BR": "Membro que fez a doação"},
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: "amount", nameLocalizations: {"pt-BR": "quantidade"},
                    description: "Value to be added",
                    descriptionLocalizations: {"pt-BR": "Valor a ser adicionado"},
                    type: ApplicationCommandOptionType.Number,
                    required: true
                }
            ]
        },
        {
            name: "remove", nameLocalizations: {"pt-BR": "remover"},
            description: "Remove an amount from the bank",
            descriptionLocalizations: {"pt-BR": "Remove um valor do banco"},
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "reason", nameLocalizations: {"pt-BR": "motivo"},
                    description: "Reason the value was removed",
                    descriptionLocalizations: {"pt-BR": "Motivo pelo qual o valor foi removido"},
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: "amount", nameLocalizations: {"pt-BR": "quantidade"},
                    description: "Value to remove",
                    descriptionLocalizations: {"pt-BR": "Valor a ser removido"},
                    type: ApplicationCommandOptionType.Number,
                    required: true
                }
            ]
        }
    ],
    visibility: "staff",
    async run(interaction) {
        if (!interaction.inCachedGuild()) return;
        const { member, guild, options } = interaction;

        if (guild.id != client.mainGuildID){
            new BreakInteraction(interaction, "Este comando só pode ser usado no servidor principal");
            return;
        }
        
        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData || memberData.registry.level < 5){
            new BreakInteraction(interaction, "Apenas líderes podem usar este comando!");
            return;
        }

        const guildData = await db.guilds.get(guild.id) as DocumentGuild | undefined;
        if (!guildData){
            new BreakInteraction(interaction, "Os dados da guilda não foram encontrados!");
            return;
        }

        const cBank = guild.channels.cache.find(c => c.name == config.guild.channels.bank);
        if (cBank?.type != ChannelType.GuildText){
            new BreakInteraction(interaction, "Não foi possível encontrar o chat do banco!");
            return;
        }

        const rows = [
            new ActionRowBuilder<ButtonBuilder>()
        ];

        const buttons = {
            confirm: new ButtonBuilder({customId: "bank-confirm-button", label: "Confirmar", style: ButtonStyle.Success}),
            cancel: new ButtonBuilder({customId: "bank-cancel-button", label: "Cancelar", style: ButtonStyle.Danger})
        };

        const currents = {
            amount: guildData.bank.total || 0
        };

        const embed = new EmbedBuilder({ color: convertHex(config.colors.default) });
        
        switch(options.getSubcommand(true)){
            case "add":{
                const mention = options.getMember("member") as GuildMember;
                const amount = options.getNumber("amount", true);
                
                const mentionData = await db.players.get(mention.id) as DocumentPlayer | undefined;
                if (!mentionData){
                    new BreakInteraction(interaction, "O membro mencionado não está registrado!");
                    return;
                }

                if (amount < 1) {
                    new BreakInteraction(interaction, "O valor deve ser positivo maior que zero!");
                    return;
                }

                embed.setDescription(`Deseja adicionar ${amount} reais doados por ${mention} ao banco da Zunder?`);

                rows[0].setComponents(buttons.confirm, buttons.cancel);

                const message = await interaction.reply({ephemeral, embeds: [embed], components: [rows[0]], fetchReply: true});
                buttonCollector(message, {max: 1}).on("collect", async (subInteraction) => {

                    if (subInteraction.customId == "bank-cancel-button"){
                        new BreakInteraction(subInteraction, "A operação foi cancelada!", {replace: true});
                        return;
                    }

                    embed.setDescription(`O valor doado por ${mention} foi adicionado ao banco!`);
                    await subInteraction.update({embeds: [embed], components: []});

                    const embedLog = new EmbedBuilder({
                        title: "📥 Valor adicionado",
                        description: `${mention} **${mention.user.tag}** apoiou o grupo \nValor: ${amount} reais`,
                        color: convertHex(config.colors.joinGreen)
                    });

                    cBank.send({embeds: [embedLog]});

                    await db.players.update(mention.id, "stats.donated", amount, "increment");

                    embed.setDescription(`**A zunder agradece pela contribuição**
                    > Você pode acompnhar como o dinheiro que o nosso grupo recebe de doações está sendo usado, no chat ${cBank}
                    
                    💵 Valor doado: \` ${amount} \` reais`);

                    mention.send({ embeds: [embed] }).catch(() => {});

                    await db.guilds.update(guild.id, "bank.total", amount, "increment");
                    const total = await db.guilds.get(guild.id, "bank.total") as number;
                    
                    cBank.edit({topic: `Valo total em conta: ${total} reais`});
                });
                return;
            }
            case "remove":{
                const reason = options.getString("reason", true);
                const amount = options.getNumber("amount", true);

                if (amount < 1) {
                    new BreakInteraction(interaction, "O valor deve ser positivo maior que zero!");
                    return;
                }

                embed.setDescription(`Deseja mesmo remover ${amount} reais do banco da Zunder?`);

                rows[0].setComponents(buttons.confirm, buttons.cancel);

                const message = await interaction.reply({ephemeral, embeds: [embed], components: [rows[0]], fetchReply: true});
                buttonCollector(message, {max: 1}).on("collect", async (subInteraction) => {

                    if (subInteraction.customId == "bank-cancel-button"){
                        new BreakInteraction(subInteraction, "A operação foi cancelada!", {replace: true});
                        return;
                    }

                    embed.setDescription("O valor foi removido do banco!");
                    await subInteraction.update({embeds: [embed], components: []});

                    const embedLog = new EmbedBuilder({
                        title: "📥 Valor removido",
                        description: `> Motivo: ${reason} \nValor: ${amount} reais`,
                        color: convertHex(config.colors.leaveRed)
                    });

                    cBank.send({embeds: [embedLog]});

                    embed.setDescription(`**A zunder agradece pela contribuição**
                    > Você pode acompnhar como o dinheiro que o nosso grupo recebe de doações está sendo usado, no chat ${cBank}
                    
                    💵 Valor doado: \` ${amount} \` reais`);

                    await db.guilds.update(guild.id, "bank.total", currents.amount - amount);
                    const total = await db.guilds.get(guild.id, "bank.total") as number;
                    
                    cBank.edit({topic: `Valo total em conta: ${total} reais`});
                });
                return;
            }
        }
    },
});