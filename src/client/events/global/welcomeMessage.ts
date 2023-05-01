
import { CanvasBuilder, CanvasFontBuilder, DocumentPlayer, Event, client, config, db } from "@/app";
import { registries } from "@/config/jsons";
import { loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder, ChannelType } from "discord.js";

export default new Event({name: "guildMemberAdd", async run(member){
    if (member.guild.id != client.mainGuildID ) return;
    
    const cGlobal = member.guild.channels.cache.find(c => c.name == config.guild.channels.global);
    if (!cGlobal || cGlobal.type != ChannelType.GuildText) return;

    const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;

    const images = {
        background: await loadImage(config.images.resolutions["1024-260"][0]),
        profile: await loadImage(member.displayAvatarURL({extension: "png", size: 1024}))
    };

    const username = member.user.username.slice(0, 25);
    const discriminator = "#" + member.user.discriminator;

    const canvasFont = new CanvasFontBuilder({family: "Montserrat", size: 20, style: "light", textBaseLine: "alphabetic"});
    
    const canvas = new CanvasBuilder(1025, 260)
    .drawImage({image: images.profile, x: 0, y: 0, radius: 82})
    .setStyle({style: config.colors.joinGreen})
    .drawRect({x: 160, y: 174, width: 8, height: 40, method: "fill", radius: 4})
    .drawRect({x: 144, y: 190, width: 40, height: 8, method: "fill", radius: 4})
    .drawRect({x: 70, y: 205, width: 104, height: 28, method: "fill", radius: 8, style: "#171717"})
    .setFont(canvasFont.data)
    .drawText({text: discriminator, method: "fill", x: 90, y: 226, style: config.colors.white})
    .setFont({family: "Montserrat", size: 60, style: "bold"})
    .drawText({text: username, method: "fill", x: 296, y: 116, style: config.colors.white})
    .setFont({family: "Montserrat", size: 40, style: "medium"});

    if (!memberData) {
        canvas.drawText({text: "Entrou no servidor".toUpperCase(), method: "fill", x: 244, y: 168, style: config.colors.joinGreen });
    } else {
        const { type, level } = memberData.registry;
        const register = registries[type].roles[level];
        
        const { colors, name } = register;
        
        canvas
        .drawText({text: "Voltou ao servidor".toUpperCase(), method: "fill", x: 244, y: 160, style: config.colors.joinGreen})
        .drawText({text: "Como".toUpperCase(), method: "fill", x: 244, y: 200, style: config.colors.joinGreen})
        .drawText({text: name.toUpperCase(), method: "fill", x: 338, y: 200, style: colors.main});
    }
    
    const buffer = canvas.data.toBuffer("image/png");
    const files = [new AttachmentBuilder(buffer, {name: "image.png"})];

    cGlobal.send({content: `<t:${~~(Date.now() / 1000)}>`, files });
}});