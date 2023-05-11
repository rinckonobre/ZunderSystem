import { GuildMember } from "discord.js";
import { config, db } from "../../..";
import { registries } from "../../../settings/jsons";
import { DocumentPlayer } from "../../interfaces";
import { findRole } from "../discord/guild";
import { systemRecords } from "./system-records";

export const systemRegister = {
    /**
     * @param member Membro que será registrado
     * - Parametros opcionais (Deixe vazio para criar um registro automaticamente)
     * @param nick Nick do membro
     * @param device Dispositivo de registro
     * @param type Tipo de registro
    */
    async create(member: GuildMember, nick?: string, device: string = "discord", type: "discord" | "zunder" = "discord"){

        const data: DocumentPlayer = {registry: {
            nick: nick || member.displayName,
            device, type, level: 1
        }};

        db.players.create({id: member.id, data})
        .catch(() => {
            console.log(`An error occurred when trying to register ${member.displayName}`.red);    
        });
    },
    async auto(member: GuildMember){
        const { guild, client, user: { tag } } = member;

        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        
        if (!memberData) {
            console.log("test2");
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
            return;
        }

        const register = registries[memberData.registry.type].roles[memberData.registry.level];
        const role = findRole(guild, register.name);

        if (role && !member.roles.cache.has(role.id)){
            member.roles.add(role);
            return;
        }
    
    

    }
};