
import { AttachmentBuilder, ChannelType } from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { DocumentPlayer, Event, ServerManager } from "../../../app/structs";
import { client, config, db } from "../../../app";
import { canvasDrawImage, canvasDrawRect, canvasSetFont, canvasDrawText } from "../../../app/functions";
import { registers } from "../../../config/jsons";

export default new Event({name: 'guildMemberAdd', async run(member){
    if (member.guild.id != client.mainGuildID ) return;
    
    const cGlobal = member.guild.channels.cache.find(c => c.name == config.guild.channels.global);
    if (!cGlobal || cGlobal.type != ChannelType.GuildText) return;

    const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;

    const canvas = createCanvas(1024, 260);
    const ctx = canvas.getContext("2d");

    const images = {
        background: await loadImage(config.images.resolutions["1024-260"][0]),
        profile: await loadImage(member.displayAvatarURL({extension: "png", size: 1024}))
    }

    canvasDrawImage(ctx, {x: 0, y: 0, image: images.background});

    const username = member.user.username.slice(0, 25);
    const discriminator = "#" + member.user.discriminator;

    const textGroupY = 100;
    const textGroupX = 200;

    canvasDrawImage(ctx, {x: 43, y: 30, image: images.profile, radius: 82});

    canvasDrawRect(ctx, {x: textGroupX + 60, y: textGroupY - 26, width: 8, height: 40, method: "fill", radius: 4, color: config.colors.joinGreen});
    canvasDrawRect(ctx, {x: textGroupX + 44, y: textGroupY - 10, width: 40, height: 8, method: "fill", radius: 4, color: config.colors.joinGreen});
    
    canvasDrawRect(ctx, {x: 70, y: 205, width: 103, height: 28, method: "fill", radius: 8, color: "#171717"});
    
    canvasSetFont(ctx, {family: "Montserrat", size: 20, style: "light", textBaseLine: "alphabetic"})
    canvasDrawText(ctx, {text: discriminator, method: "fill", x: 90, y: 226, color: config.colors.white})
    
    canvasSetFont(ctx, {family: "Montserrat", size: 60, style: "bold", textBaseLine: "alphabetic"})
    canvasDrawText(ctx, {text: username, method: "fill", x: textGroupX + 96, y: textGroupY + 16, color: config.colors.white})
    
    canvasSetFont(ctx, {family: "Montserrat", size: 40, style: "medium", textBaseLine: "alphabetic"})
    if (!memberData || !memberData.registry) {
        canvasDrawText(ctx, {text: "Entrou no servidor".toUpperCase(), method: "fill", x: textGroupX + 44, y: textGroupY + 68, color: config.colors.joinGreen})
    } else {
        const { type, level } = memberData.registry;
        const register = registers[type].find(r => r.level == level);
        
        if (!register) return;
        const { color, dependency, name } = register;

        
        canvasDrawText(ctx, {
            text: "Voltou no servidor".toUpperCase(), method: "fill", 
            x: textGroupX + 44, y: textGroupY + 68, 
            color: config.colors.joinGreen
        })
        canvasSetFont(ctx, {family: "Montserrat", size: 26, style: "medium", textBaseLine: "alphabetic"})
        
        canvasDrawText(ctx, {
            text: "Como".toUpperCase(), method: "fill", 
            x: textGroupX + 44, y: textGroupY + 100, 
            color: config.colors.joinGreen
        })

        canvasDrawText(ctx, {text: name.toUpperCase(), method: "fill", x: textGroupX + 138, y: textGroupY + 100, color })
        
        const role = ServerManager.findRole(member.guild, name);
        if (!role) return;
        member.roles.add(role);

        if (dependency) {
            const roleDependency = ServerManager.findRole(member.guild, register.dependency);
            if (roleDependency) member.roles.add(roleDependency)
        }

    }
    
    const buffer = canvas.toBuffer("image/png");
    const files = [new AttachmentBuilder(buffer, {name: "image.png"})]

    cGlobal.send({content: `<t:${~~(Date.now() / 1000)}>`, files })
}})