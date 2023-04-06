import { ApplicationCommandOptionType, ApplicationCommandType, GuildMember } from "discord.js";
import { db } from "../..";
import { systemProfile } from "../../functions";
import { BreakInteraction, Command, DocPlayer } from "../../structs";

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

        const memberData = await db.players.get(profileMember.id) as DocPlayer | undefined;
        //await playerColl.getDocData(profileMember.id) as DocPlayer | undefined;

        if (!memberData || !memberData.registry) {
            const text = (profileMember.id == member.id) ? "Você" : "O membro mencionado";
            new BreakInteraction(interaction, `${text} não está registrado no servidor e não pode ter um perfil`);
            return;
        }

        systemProfile.showMember(interaction, profileMember, memberData);

    },
});
