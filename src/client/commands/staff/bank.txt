import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder, GuildMember, TextChannel } from "discord.js";

import { systemRegister } from "../../functions";
import { BreakInteraction, Command, DiscordCreate, DocumentGuild, DocumentPlayer, Firestore, GuildManager } from "../../structs";
import { config } from "../..";

const playersColl = new Firestore("players");
const guildsColl = new Firestore("guilds");

export default new Command({
    name: "banco",
    description: "Gerencia o banco da Zunder",
    type: ApplicationCommandType.ChatInput,
    visibility: "staff",
    options: [
        {
            name: "adicionar",
            description: "Adiciona um valor ao banco",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "membro",
                    description: "Membro que fez a doação",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "valor",
                    description: "Quantidade doada para o banco",
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                },
            ]
        },
        {
            name: "remover",
            description: "Remove um valor ao banco",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "valor",
                    description: "quantidade doada para o banco",
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                },
                {
                    name: "motivo",
                    description: "Razão pela qual o valor foi removido",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ]
        }
    ],
    async run({ interaction, options }) {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;
        const member = interaction.member as GuildMember;
        const guild = interaction.guild!;

        const mention = options.getMember("membro") as GuildMember;
        const value = options.getNumber("valor", true);

        if (value < 1) {
            new BreakInteraction(interaction, "O valor deve ser positivo maior que zero!");
            return;
        }

        const guildManager = new GuildManager(guild);
        const cBank = guildManager.findChannel<TextChannel>(config.guild.channels.bank, ChannelType.GuildText);
        if (!cBank) {
            new BreakInteraction(interaction, "O chat do banco não está disponível!");
            return;
        };

        const memberData = await playersColl.getDocData(member.id) as DocumentPlayer | undefined;
        if (!memberData || (memberData.registry?.level || 1) < 5) {
            new BreakInteraction(interaction, "Apenas líderes podem utilizar este comando!");
            return;
        }

        const guildData = await guildsColl.getDocData(guild.id) as DocumentGuild | undefined;
        if (!guildData) {
            interaction.reply({ ephemeral: true, content: "Os dados deste servidor não estavam configurados, utilize o comando novamente!" });
            guildsColl.createDoc(guild.id, {
                bank: {
                    total: 0
                }
            });
            return;
        }

        if (!guildData.bank) {
            guildData.bank = { total: 0 };
        }

        switch (options.getSubcommand()) {
            case "adicionar": {

                if (mention.user.bot) {
                    new BreakInteraction(interaction, "Não mencione usuários bot neste comando!");
                    return;
                }

                guildData.bank.total = guildData.bank.total + value;

                guildsColl.saveDocData(guild.id, guildData);

                const embed = new EmbedBuilder()
                    .setTitle("📥 Valor adicionado")
                    .setColor(config.colors.systems.economy as ColorResolvable)
                    .setDescription(`${mention} **${mention.user.tag}** apoiou o grupo
                💵 Valor: \` ${value} \` reais`);

                cBank.edit({ topic: `Valor total em conta: ${guildData.bank.total} reais` });
                cBank.send({ embeds: [embed] });

                interaction.reply({ ephemeral: true, embeds: [DiscordCreate.simpleEmbed(config.colors.success, `${value} reais adicionado ao banco da Zunder!`)] });

                const supporterRole = guildManager.findRole(config.guild.roles.functional.supporter);
                if (supporterRole) {
                    if (!mention.roles.cache.has(supporterRole.id)) mention.roles.add(supporterRole);

                    embed.setTitle(null)
                        .setDescription(`**A zunder agradece pela contribuição**
                    > Você pode acompnhar como o dinheiro que o nosso grupo recebe de doações está sendo usado no chat ${cBank}
                    
                    💵 Valor doado: \` ${value} \` reais`);

                    mention.send({ embeds: [embed] })
                        .catch(() => { });
                }

                const mentionData = await playersColl.getDocData(mention.id) as DocumentPlayer | undefined;
                if (!mentionData || !mentionData.registry) {
                    systemRegister.create(mention);
                    playersColl.getDocManager(mention.id).set("stats.donated", value);
                    return;
                }

                if (!mentionData?.stats) {
                    mentionData.stats = { donated: value };
                } else {
                    const currDonated = mentionData.stats.donated || 0;
                    mentionData.stats.donated = currDonated + value;
                }
                playersColl.saveDocData(mention.id, mentionData);


                break;
            }
            case "remover": {
                guildData.bank.total = guildData.bank.total - value;
                const reason = options.getString("motivo", true);

                const embed = new EmbedBuilder()
                    .setColor(config.colors.danger as ColorResolvable)
                    .setTitle("📤 Valor gasto")
                    .setDescription(`💵 Valor: \` ${value} \` reais
                > Motivo: ${reason}`);

                cBank.edit({ topic: `Valor total em conta: ${guildData.bank.total} reais` });
                cBank.send({ embeds: [embed] });

                interaction.reply({ ephemeral: true, embeds: [DiscordCreate.simpleEmbed(config.colors.success, `${value} reais removidos do banco da Zunder!`)] });

                guildsColl.saveDocData(guild.id, guildData);
                break;
            }
        }
    }
});