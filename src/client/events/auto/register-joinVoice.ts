import { DocumentPlayer, Event, client, config, db } from "@/app";
import { findRole, systemRecords, systemRegister } from "@/app/functions";
import { registries } from "@/config/jsons";

export default new Event({name: "voiceStateUpdate", async run(oldState, newState){
	if (newState?.guild?.id != client.mainGuildID || oldState.channel === newState.channel) return;
    const { member, guild } = newState;
    if (!member || member.user.bot) return;

    const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
    if (memberData) return;

    systemRegister.create(member);

    const memberRole = findRole(guild, registries.discord.roles[1].name);
    if (memberRole) member.roles.add(memberRole);

    systemRecords.create({
        guild, title: "Registro",
        style: "Simple",
        mention: member,
        color: config.colors.primary,
        staff: client,
        description: `${member} **${member.user.tag}**

        Registrado(a) como ${memberRole} pelo sistema`,
    });
}});