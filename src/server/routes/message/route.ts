import { Request } from "express";
import { Route } from "../../types/Route";
import { StatusCodes } from "http-status-codes";
import { client } from "../../..";
import { ChannelType } from "discord.js";

interface Body {
    channelId: string,
    content: string
}

export default new Route({
    POST(req: Request<{}, {}, Body>, res){
        const { channelId, content } = req.body;
        console.log(req.body);

        const guild = client.guilds.cache.get(client.mainGuildId);
        const channel = guild?.channels.cache.get(channelId);

        if (channel?.type !== ChannelType.GuildText) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Message not sended");
            return;
        }

        channel.send({content});

        res.status(StatusCodes.OK).send("Message sended");
    }
});