import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, Collection, EmbedBuilder, GuildMember, codeBlock } from "discord.js";
import { db, client, config } from "../../..";
import { Command } from "../../../app/base";
import { BreakInteraction, MenuBuilder } from "../../../app/classes";
import { convertHex, buttonCollector } from "../../../app/functions";
import { DocumentPlayer } from "../../../app/interfaces";
import { infos, terms } from "../../../settings/jsons";
import { zeroPad } from "../../../app/functions/utils/format";

export default new Command({
    name: "informações",
    description: "Mostra informações sobre o servidor",
    type: ApplicationCommandType.ChatInput,
    visibility: "public",
    dmPermission: false,
    options: [
        {
            name: "comandos",
            description: "Exibe todos os comandos do servidor",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "bot",
            description: "Exibe informações sobre o bot",
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],
    async run(interaction) {
        const { member, options, locale } = interaction;

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        
        const subCommand: string = options.getSubcommand();

        switch (subCommand) {
            case "comandos": {
                new MenuBuilder({
                    mainEmbed: new EmbedBuilder({
                        title: "⌨️ Comandos",
                        color: convertHex(config.colors.theme.primary)
                    }),
                    maxItemsPerPage: 8,
                    type: "Grid_2",
                    ephemeral: true,
                    items: client.Commands.map(command => {
                        const typeIcons = { 1: "⌨️", 2: "👤",3: "✉️" };
                        const visibility = {
                            "public": "Pública",
                            "private": "Privada",
                            "restricted": "Restrito"
                        };

                        const description = (command.type == ApplicationCommandType.ChatInput) 
                        ? command.descriptionLocalizations?.[locale] || command.description
                        : "Comando de aplicativo";

                        const typeUsages = { 1: "/", 2: "Usuário/Apps/", 3: "Mensagem/Apps/" };
                        const title = `${typeIcons[command.type]} ${command.nameLocalizations?.[locale] || command.name}`;
                        const usage = `\`${typeUsages[command.type]}${command.nameLocalizations?.[locale] || command.name}\``;
                        const content = `> Visibilidade: __${visibility[command.visibility]}__ \n> ${usage} \n${codeBlock(description)}`;
                        
                        if (command.visibility == "private" && member.id == member.guild.ownerId) {
                            return {title, description: content, color: convertHex(config.colors.theme.danger) };
                            // commandInfoMenu.addItem({ title, content, color: convertHex(config.colors.theme.danger)});
                        } else if (command.visibility == "restricted" && (memberData?.registry?.level || 1) > 1) {
                            return {title, description: content, color: convertHex(config.colors.theme.primary) };
                            // commandInfoMenu.addItem({ title, content, color: convertHex(config.colors.theme.primary) });
                        } else {
                            return {title, description: content, color: convertHex(config.colors.theme.success) };
                            // commandInfoMenu.addItem({ title, content, color: convertHex(config.colors.theme.success) });
                        }
                    })
                }).show(interaction, member);
                return;
            }
            case "bot": {
                interaction.reply({ephemeral: true, embeds: [
                    new EmbedBuilder({
                        title: "Bot da Zunder",
                        color: convertHex(config.colors.theme.zunder),
                        thumbnail: {url: client.user!.displayAvatarURL() },
                        description: ` ${client.user}
                        > Conta um sistemas de interação, economia e administração.
                        - Sistemas de interação incluem envio de trabalhos, 
                        compartilhamento de recursos, sugestões e imagens.
                        - Sistemas de economia incluem comandos de perfil, 
                        níveis e xp, moedas, rankings e loja.
                        - Sistemas de administração incluem gerenciamento 
                        completo de membros pela staff, proteções contra 
                        ataques ao servidor, contra flood e spam.
                        Registro de membros e de logs no servidor 
    
                        Desenvolvido por [Rincko](https://github.com/ricknobre)
                        Linguagem: Typescript
                        Libs:
                        - discord.js V14
                        - distube
                        - firebase-admin
                        - fs
                        - dotenv
                        - node-cron`
                    })
                ]});
                return;
            }
        }
    },
    buttons: {
        "information-index": async (interaction) => {
            const sections = infos.sections.map(s => s).reverse();
            const rows: Array<ActionRowBuilder<ButtonBuilder>> = [];

            for (let currRow = 0; currRow < 5; currRow++){
                const row = new ActionRowBuilder<ButtonBuilder>();
                for (let currButton = 0; currButton < 4; currButton++){
                    const button = sections.pop()?.button;
                    if (!button) break;
                    // const { customId, emoji, label, style } = button;
                    row.addComponents(new ButtonBuilder(button));
                }
                if (row.components.length < 1) break;
                rows.push(row);
            }

            const message = await interaction.reply({
                ephemeral: true, components: rows, fetchReply: true,
                embeds: [new EmbedBuilder({
                    title: "Índice de informações",
                    color: convertHex(config.colors.theme.primary),
                    description: "Clique nos botões abaixo para ver informações de cada categoria"
                })]
            });

            buttonCollector(message).on("collect", (subInteraction) => {
                const info = infos.sections.find(s => s.button.customId == subInteraction.customId);
                if (!info){
                    new BreakInteraction(subInteraction, "Informações indisponíveis");
                    return;
                }

                const { title, description, color, image, thumb, fields } = info;

                const embed = new EmbedBuilder({
                    title, description, 
                    color: (color ? convertHex(color) : convertHex(config.colors.theme.primary)),
                    fields
                })
                .setThumbnail(thumb)
                .setImage(image);

                subInteraction.update({embeds: [embed], components: rows});
            });

        }
    },
    stringSelects: {
        "terms-index": async (interaction) => {
            const item = interaction.values[0];

            const termsCategory = terms.find(t => t.category == item);
            if (!termsCategory) {
                new BreakInteraction(interaction, "Termo indisponível!");
                return;
            }

            const embed = new EmbedBuilder({
                title: termsCategory.description,
                color: convertHex(config.colors.theme.zunder),
                description: termsCategory.terms
                .map((term, index) => `- 📃 **(${termsCategory.prefix}${zeroPad(index++)})** ${term}`)
                .join("\n\n"),
                footer: { text: "Administração Zunder" }
            });

            interaction.reply({ephemeral: true, embeds: [embed]});
        }
    }
});