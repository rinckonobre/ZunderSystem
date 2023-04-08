import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, Collection, ColorResolvable, EmbedBuilder, GuildMember } from "discord.js";
import { config, db } from "../..";
import { informations, terms } from "../../jsons";

import { toHexColor } from "../../functions/aplication/convert";
import { Command, DiscordCreate, DocumentPlayer, EmbedMenuBuilder, Interruption, ReplyBuilder, TextUtils } from "../../structs";

export default new Command({
    name: "informações",
    description: "Mostra informações sobre o servidor",
    type: ApplicationCommandType.ChatInput,
    visibility: "public",
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
    async run({client, interaction, options}) {
        if (!interaction.isChatInputCommand()) return;
        const member = interaction.member as GuildMember;

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        
        const subCommand: string = options.getSubcommand();

        switch (subCommand) {
        case "comandos": {
            const commandInfoMenu = new EmbedMenuBuilder({title: "⌨️ Comandos", maxItems: 8, type: "GRID_2"})
                .editEmbed(embed => embed.setColor(toHexColor(config.colors.primary)));
            client.commands.forEach(command => {

                const typeIcons = {
                    1: "⌨️",
                    2: "👤",
                    3: "✉️"
                };
                const visibility = {
                    "public": "Pública",
                    "private": "Privada",
                    "staff": "Somente staffs"
                };
                const typeUsages = {
                    1: "/",
                    2: "Usuário/Apps/",
                    3: "Mensagem/Apps/"
                };
                const title = `${typeIcons[command.type || 1]} ${TextUtils.captalize(command.name)}`;
                const usage = `\`${typeUsages[command.type || 1]}${command.name}\``;
                const description = (command.type == ApplicationCommandType.ChatInput) ? command.description : "Comando de aplicativo";
                const content = `> Visibilidade: __${visibility[command.visibility || "public"]}__ \n> ${usage} \n> \`\`\`${description}\`\`\``;

                if (command.visibility == "private" && member.id == member.guild.ownerId) {
                    commandInfoMenu.addItem({ title, content, color: toHexColor(config.colors.danger)});
                } 
                if (command.visibility == "staff" && (memberData?.registry?.level || 1) > 1) {
                    commandInfoMenu.addItem({ title, content, color: toHexColor(config.colors.primary) });
                }
                if (command.visibility == "public") {
                    commandInfoMenu.addItem({ title, content, color: toHexColor(config.colors.success) });
                }
            });

            commandInfoMenu.setEphemeral(true)
                .send(interaction, member);
                

            //PaginatedEmbeds({interaction, embed, maxItemsPerPage: 6, colluns: 2, items: commands});

            return;
        }
        case "bot": {
            const embed = new EmbedBuilder()
                .setColor(toHexColor(config.colors.zunder))
                .setTitle("Bot da Zunder")
                .setThumbnail(client.user?.displayAvatarURL() || null)
                .setDescription(` ${client.user}
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
                - node-cron
                `);

            new ReplyBuilder(interaction, true)
                .addEmbed(embed)
                .send();
            return;
        }
        }
    },
    buttons: new Collection([
        ["information-index", async (interaction) => {
            const categories = [...informations.categories];
            categories.reverse();

            const rows: Array<ActionRowBuilder<ButtonBuilder>> = [];

            for (let currRow = 0; currRow < 5; currRow++) {
                const row = new ActionRowBuilder<ButtonBuilder>();
                for (let currButton = 0; currButton < 4; currButton++) {
                    const button = categories.pop()?.button;
                    if (!button) break;
                    const { customId, emoji, label, style } = button;
                    //console.log(customId)
                    row.addComponents(new ButtonBuilder({ customId, emoji, style, label }));
                }
                if (row.components.length < 1) break;
                rows.push(row);
            }

            const msg = await interaction.reply({ephemeral: true, components: rows, fetchReply: true});
            
            DiscordCreate.buttonCollector(msg, async (buttonInteraction) => {
                const info = informations.categories.find(c => c.button.customId == buttonInteraction.customId);
                if (!info) {
                    new Interruption(interaction, "Informações indisponíveis!");
                    return;
                }
                buttonInteraction.deferUpdate();

                const {title, description, color, image, thumbnail } = info;

                const embed = new EmbedBuilder()
                    .setColor(color as ColorResolvable)
                    .setTitle(title)
                    .setThumbnail(thumbnail)
                    .setImage(image)
                    .setDescription(TextUtils.jsonParse(description) || "erro")
                    .setFooter(informations.footer);

                interaction.followUp({ephemeral: true, embeds: [embed]});
            });

        }],
    ]),
    selects: new Collection([
        ["terms-index", async (interaction) => {

            const item = interaction.values[0];

            const termsCategory = terms.find(t => t.category == item);
            if (!termsCategory) {
                new Interruption(interaction, "Termo indisponível!");
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(toHexColor(config.colors.zunder))
                .setTitle(termsCategory.description)
                .setDescription(termsCategory.terms.map((term, index) => {
                    index += 1;
                    return `📃**(${termsCategory.prefix}${index < 10 ? "0" + index : index})** ${term}`;
                }).join("\n\n"))
                .setFooter({text: "Administração Zunder"});

            interaction.reply({ephemeral: true, embeds: [embed]});
        }]
    ])
});