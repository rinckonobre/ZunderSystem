import { codeBlock, TextChannel } from "discord.js";
import { client, config } from "../..";
import { ServerManager } from "../../structs";

export function logger(message: string){

    const guild = client.guilds.cache.get(client.mainGuildID);
    if (!guild) {
        console.log("Não foi possível localizar o servidor principal")
        console.log(message)
        return;
    }

    const cLogs = ServerManager.findChannel(guild, config.guild.channels.logs) as TextChannel | undefined;
    if (!cLogs) {
        console.log("Não foi possível localizar o chat de logs");
        console.log(message);
        return;
    }

    const time = `<t:${~~(Date.now() / 1000)}:t>`;
    cLogs.send({content: `${time} ${codeBlock(message)}`})
}