import { ApplicationCommandType, GuildMember } from "discord.js";
import { db } from "../../..";
import { Command } from "../../../app/base";
import { BreakInteraction } from "../../../app/classes";
import { systemProfile } from "../../../app/functions";
import { DocumentPlayer } from "../../../app/interfaces";

export default new Command({
    name: "Zunder Profile",
    nameLocalizations: {"pt-BR": "Perfil Zunder"},
    type: ApplicationCommandType.User,
    visibility: "public",
    async run(interaction) {

        if (!interaction.inCachedGuild()) return;
        const member = interaction.targetMember;
        
        if (member.user.bot) {
            new BreakInteraction(interaction, "Bots não podem ter um perfil");
            return;
        }

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;

        if (!memberData || !memberData.registry) {
            new BreakInteraction(interaction, "O membro mencionado não está registrado no servidor e não pode ter um perfil");
            return;
        }

        systemProfile.showMember(interaction, member, memberData);
    },
});