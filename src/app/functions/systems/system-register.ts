import { GuildMember } from "discord.js";
import { DocumentPlayer, db } from "../..";

//const playerColl = new Firestore("players");

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

        db.players.create({id: member.id, data});
    }
};