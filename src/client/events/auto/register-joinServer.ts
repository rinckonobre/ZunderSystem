import { DocumentPlayer, Event, config, db } from "@/app";
import { systemRegister, findRole, systemRecords } from "@/app/functions";
import { registries } from "@/config/jsons";


export default new Event({name: "guildMemberAdd", async run(member){
    const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
    if (memberData || member.user.bot) return;

    const { guild, client, user: { tag } } = member;

    systemRegister.create(member);

    const memberRole = findRole(guild, registries.discord.roles[1].name);
    if (memberRole) member.roles.add(memberRole);

    systemRecords.create({
        guild, title: "Registro",
        style: "Simple",
        mention: member,
        color: config.colors.primary,
        staff: client,
        description: `${member} **${tag}**

        Registrado(a) como ${memberRole} pelo sistema`,
    });
}});