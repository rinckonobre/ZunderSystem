import { loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder, ChannelType } from "discord.js";
import { Event } from "../../../app/base";
import { client, db, config } from "../../..";
import { CanvasFontBuilder, CanvasBuilder } from "../../../app/classes";
import { createLinearGradiente } from "../../../app/functions";

export default new Event({name: "guildMemberRemove", async run(member){
    if (member.guild.id != client.mainGuildId) return;
    const { guild } = member;
    
    const cGlobal = guild.channels.cache.find(c => c.name == config.guild.channels.global);
    if (cGlobal?.type !== ChannelType.GuildText) return;

    const images = {
        background: await loadImage(config.images.resolutions["1024-260"][0]),
        profile: await loadImage(member.displayAvatarURL({extension: "png", size: 1024}))
    };

    const styles = {
        light: config.colors.tailwind.neutral[100],
        text: config.colors.tailwind.neutral[200],
        danger: config.colors.tailwind.red[600]
    };

    const canvasFont = new CanvasFontBuilder({family: "Montserrat", size: 60, style: "bold", textBaseLine: "top"});
    const canvas = new CanvasBuilder(1024, 260)
    .setFont(canvasFont.data)
    .drawImage({image: images.background, x: 0, y: 0});

    const gradient = createLinearGradiente(canvas.context, {
        start: {x: 200, y: -100}, end: {x: 400, y: 760},
        startColor: "rgba(0, 0, 0, 0.01)", endColor: styles.danger
    });

    canvas
    .drawRect({method: "fill", x: 0, y: 0, width: 1024, height: 300, style: gradient})
    .drawImage({image: images.profile, x: 40, y: 34, radius: 100});

    const displayname = member.displayName.slice(0, 18);
    const displaynameWidth = canvas.context.measureText(displayname).width;
    
    canvas
    .drawText({method: "fill", x: 260, y: 55, text: displayname, style: styles.light})
    .setFont(canvasFont.setSize(24).setStyle("light").data)
    .drawText({method: "fill", x: 260 + displaynameWidth + 10, y: 72, text: "@" + displayname, style: styles.text})
    .setFont(canvasFont.setSize(40).setStyle("regular").data)
    .setFilter().brightness(110)
    .drawText({method: "fill", x: 260, y: 116, text: "Saiu do servidor".toUpperCase(), style: styles.danger})
    .clearFilter();
    
    const buffer = canvas.data.toBuffer("image/png");
    const files = [new AttachmentBuilder(buffer, {name: "image.png"})];

    cGlobal.send({content: `<t:${~~(Date.now() / 1000)}>`, files });
}});