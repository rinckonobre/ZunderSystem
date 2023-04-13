import { ApplicationCommandOptionType, ApplicationCommandType, Collection, GuildMember } from "discord.js";
import { db } from "../..";
import { logger, systemProfile } from "../../functions";
import { BreakInteraction, Command, DocumentPlayer } from "../../structs";

export default  new Command({
    name: "profile",
    nameLocalizations: {"pt-BR": "perfil"},
    description: "Show a member profile",
    descriptionLocalizations: {"pt-BR": "Exibe o perfil Zunder de um membro"},
    type: ApplicationCommandType.ChatInput,
    visibility: "public",
    options: [
        {
            name: "membro",
            description: "Exibir o perfil do membro mencinado",
            type: ApplicationCommandOptionType.User,
        }
    ],
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand()) return;

        const member = interaction.member as GuildMember;
        const mention = options.getMember("membro") as GuildMember | undefined;
        
        let profileMember: GuildMember;
        if (mention) {
            profileMember = mention;
        } else {
            profileMember = member;
        }
        
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
    buttons: new Collection([
        ["profile-close-button", async (interaction) => {
            if (!interaction.inCachedGuild()) return;
            interaction.deferUpdate()
            const { member, message: { content }} = interaction;
            const UserProfileId = content.slice(4).slice(0, content.length - 5);
            
            if (UserProfileId != member.id) return;
            interaction.message.delete().catch(logger)
        }]
    ])
});
