import { DocumentPlayer, Event, config, db } from "@/app";
import { systemRegister, findRole, systemRecords } from "@/app/functions";
import { registries } from "@/config/jsons";


export default new Event({
    name: "messageCreate",
    async run(message) {
        if (!message.inGuild()) return;
        const { member, guild, client } = message;
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

    },
});