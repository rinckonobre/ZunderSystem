import { GuildMember } from "discord.js";
import { db } from "../..";
import { DocPlayer } from "../../structs";

//const playerColl = new Firestore("players");

export const systemRegister = {
    /**
     * @param member Membro que será registrado
     * - Parametros opcionais (Deixe vazio para criar um registro automaticamente)
     * @param nick Nick do membro
     * @param device Dispositivo de registro
     * @param type Tipo de registro
    */
    async create(member: GuildMember, nick?: string, device?: string, type?: "discord" | "zunder"){

        const data: DocPlayer = {registry: {
            nick: nick || member.displayName,
            device: device || "discord",
            type: type || "discord",
            level: 1
        }}

        db.players.create({id: member.id, data})

        // playerColl.createDoc(member.id, {registry: {
        //     nick: finalNick,
        //     device: finalDevice,
        //     type: finalType,
        //     level: 1
        // }} as DocPlayer)
    }
} 