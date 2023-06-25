import { ChannelType, codeBlock } from "discord.js";
import { findChannel } from "../discord/guild";
import { client, config } from "../../..";

export function logger(message: string){

    const guild = client.guilds.cache.get(client.mainGuildID);
    if (!guild) {
        console.log("Não foi possível localizar o servidor principal");
        console.log(message);
        return;
    }

    const cLogs = findChannel(guild, config.guild.channels.logs, ChannelType.GuildText);
    if (!cLogs) {
        console.log("Não foi possível localizar o chat de logs");
        console.log(message);
        return;
    }

    const time = `<t:${~~(Date.now() / 1000)}:t>`;
    cLogs.send({content: `${time} ${codeBlock(message)}`});
}