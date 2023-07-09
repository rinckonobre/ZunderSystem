import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, Collection, GuildMember, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { db } from "../../..";
import { Command } from "../../../app/base";
import { BreakInteraction } from "../../../app/classes";
import { systemProfile, stringSelectCollector } from "../../../app/functions";
import { DocumentPlayer } from "../../../app/interfaces";

export default new Command({
    name: "profile",
    nameLocalizations: {"pt-BR": "perfil"},
    description: "Show a member profile",
    descriptionLocalizations: {"pt-BR": "Exibe o perfil Zunder de um membro"},
    type: ApplicationCommandType.ChatInput,
    visibility: "public",
    dmPermission: false,
    options: [
        {
            name: "membro",
            description: "Exibir o perfil do membro mencinado",
            type: ApplicationCommandOptionType.User,
        }
    ],
    async run(interaction) {
        const { member, options } = interaction;
        //const member = interaction.member as GuildMember;
        const mention = options.getMember("membro");
        
        const profileMember = mention || member;
        
        if (profileMember.user.bot) {
            new BreakInteraction(interaction, "Bots não podem ter um perfil");
            return;
        }

        const memberData = await db.players.get(profileMember.id) as DocumentPlayer | undefined;
        //await playerColl.getDocData(profileMember.id) as DocumentPlayer | undefined;

        if (!memberData || !memberData.registry) {
            const text = (profileMember.id == member.id) ? "Você" : "O membro mencionado";
            new BreakInteraction(interaction, `${text} não está registrado no servidor e não pode ter um perfil`);
            return;
        }

        systemProfile.showMember(interaction, profileMember, memberData);

    },
    buttons: {
        "profile-close-button": async (interaction) => {
            if (!interaction.inCachedGuild()) return;
            interaction.deferUpdate();
    
            const { member, message: { embeds }} = interaction;
            const executorId = embeds[0].footer?.text;
    
            if (!executorId || executorId !== member.id) return;
            
            interaction.message.delete().catch(console.log);
        },
        "profile-config-button": async (interaction) => {
            if (!interaction.inCachedGuild()) return;
    
            const { member, message: { embeds }} = interaction;
            const executorId = embeds[0].footer?.text;
    
            if (!executorId || executorId !== member.id) {
                new BreakInteraction(interaction, "Você não pode configurar o perfil de outro membro!");
                return;
            }
    
            const row = new ActionRowBuilder<StringSelectMenuBuilder>({components: [
                new StringSelectMenuBuilder({
                    customId: "profile-config-select",
                    placeholder: "Selecione o que deseja configurar",
                    options: [
                        { label: "Sobre mim", value: "about", description: "Alterar o texto sobre mim do perfil", emoji: "🖊️" },
                    ]
                })
            ]});
    
            const message = await interaction.reply({ephemeral: true, components: [row], fetchReply: true});
    
            stringSelectCollector(message).on("collect", subInteraction => {
                const selected = subInteraction.values[0];
    
                switch(selected){
                    case "about": {
                        subInteraction.showModal(new ModalBuilder({
                            customId: "profile-config-about-modal",
                            title: "Alterar sobre mim",
                            components: [
                                new ActionRowBuilder<TextInputBuilder>({components: [
                                    new TextInputBuilder({
                                        customId: "profile-new-about-input",
                                        label: "Sobre mim",
                                        placeholder: "Digite seu novo \"sobre mim\" de perfil",
                                        maxLength: 180,
                                        style: TextInputStyle.Paragraph,
                                        required: true
                                    })
                                ]}),
                            ]
                        }));
                        break;
                    }
                }
            });
        }
    },
    modals: {
        "profile-config-about-modal": async interaction => {
            if (!interaction.inCachedGuild()) return;
            const { member } = interaction;          
            const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
            if (!memberData){
                new BreakInteraction(interaction, "Você não está registrado!");
                return;
            }
    
            await interaction.deferReply({ephemeral: true});
    
            const newAbout = interaction.fields.getTextInputValue("profile-new-about-input");
            db.players.update(member.id, "config.profile.about", newAbout)
            .then(() => {
                interaction.editReply({content: "O sobre mim do seu perfil foi alterado! Abra seu perfil novamente para atualizar"});
            })
            .catch(() => {
                interaction.editReply({content: "Ocorreu um erro ao tentar alterar o sobre mim do seu perfil! Contate o dev"});
            });
        }
    }
});