import { loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder, ChannelType } from "discord.js";
import { Event } from "../../../app/base";
import { client, db, config } from "../../..";
import { CanvasFontBuilder, CanvasBuilder } from "../../../app/classes";
import { DocumentPlayer } from "../../../app/interfaces";
import { registries } from "../../../settings/jsons";
import { createLinearGradiente } from "../../../app/functions";

export default new Event({name: "guildMemberAdd", async run(member){
    if (member.guild.id != client.mainGuildID ) return;
    const { guild } = member;
    
    const cGlobal = guild.channels.cache.find(c => c.name == config.guild.channels.global);
    if (cGlobal?.type !== ChannelType.GuildText) return;

    const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
    
    const images = {
        background: await loadImage(config.images.resolutions["1024-260"][0]),
        profile: await loadImage(member.displayAvatarURL({extension: "png", size: 1024}))
    };

    const styles = {
        light: config.colors.tailwind.neutral[100],
        text: config.colors.tailwind.neutral[200],
        success: config.colors.tailwind.green[600],
    };

    const canvasFont = new CanvasFontBuilder({family: "Montserrat", size: 60, style: "bold", textBaseLine: "top"});
    const canvas = new CanvasBuilder(1024, 260)
    .setFont(canvasFont.data)
    .drawImage({image: images.background, x: 0, y: 0});

    const gradient = createLinearGradiente(canvas.context, {
        start: {x: 200, y: -100}, end: {x: 400, y: 760},
        startColor: "rgba(0, 0, 0, 0.01)", endColor: styles.success
    });

    canvas
    .drawRect({method: "fill", x: 0, y: 0, width: 1024, height: 300, style: gradient})
    .drawImage({image: images.profile, x: 40, y: 34, radius: 100});

    const displayname = member.displayName.slice(0, 18);
    const displaynameWidth = canvas.context.measureText(displayname).width;

    canvas
    .drawText({method: "fill", x: 260, y: 55, text: displayname, style: styles.light})
    .setFont(canvasFont.setSize(24).setStyle("light").data)
    .drawText({method: "fill", x: 260 + displaynameWidth + 10, y: 72, text: "@" + displayname, style: styles.text});
    canvas
    .setFont(canvasFont.setSize(40).setStyle("regular").data)
    .setFilter().brightness(110);

    if (memberData){
        const { type, level } = memberData.registry;
        const register = registries[type].roles[level];
        
        const { colors, name } = register;

        canvas
        .drawText({method: "fill", x: 260, y: 126, text: "Voltou no servidor".toUpperCase(), style: styles.success})
        .clearFilter()
        .setFont(canvasFont.setSize(30).data)
        .drawText({method: "fill", x: 260, y: 168, text: "Como: ".toUpperCase(), style: styles.success})
        .drawText({method: "fill", x: 370, y: 168, text: name.toUpperCase(), style: colors.main});

    } else {
        
        canvas
        .drawText({method: "fill", x: 260, y: 116, text: "Entrou no servidor".toUpperCase(), style: styles.success})
        .clearFilter();
    }
    
    const buffer = canvas.data.toBuffer("image/png");
    const files = [new AttachmentBuilder(buffer, {name: "image.png"})];

    cGlobal.send({content: `<t:${~~(Date.now() / 1000)}>`, files });
}});