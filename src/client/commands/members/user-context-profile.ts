import { ApplicationCommandType, GuildMember } from "discord.js";
import { Command, BreakInteraction, db, DocumentPlayer } from "@/app";
import { systemProfile } from "@/app/functions";

export default new Command({
    name: "Zunder Profile",
    nameLocalizations: {"pt-BR": "Perfil Zunder"},
    type: ApplicationCommandType.User,
    visibility: "public",
    async run({interaction}) {
        if (!interaction.isUserContextMenuCommand()) return;
        
        const member = interaction.targetMember as GuildMember;
        
        if (member.user.bot) {
            new BreakInteraction(interaction, "Bots não podem ter um perfil");
            return;
        }

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;

        if (!memberData || !memberData.registry) {
            new BreakInteraction(interaction, "O membro mencionadonão está registrado no servidor e não pode ter um perfil");
            return;
        }

        systemProfile.showMember(interaction, member, memberData);
    },
});