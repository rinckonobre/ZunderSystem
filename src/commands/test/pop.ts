import { ApplicationCommandType, Attachment, AttachmentBuilder } from 'discord.js';
import { Command } from "../../structs";
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { canvasDrawImage, canvasDrawRect, canvasDrawText, canvasSetFont, canvasStyle, createLinearGradiente } from '../../functions';
import { config } from '../..';
import { CanvasBuilder } from '../../structs/classes/CanvasBuilder';

export default new Command({
    name: "pop",
    description: "Legendary test command of Zunder",
    descriptionLocalizations: {
        "pt-BR": "Comando lendário de testes da Zunder",
    },
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    async run({ client, interaction, options }) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { guild, member } = interaction;

        await interaction.deferReply({ephemeral: true});

        // const canvas = createCanvas(560, 280);
        // const ctx = canvas.getContext("2d");

        
        // canvasDrawRect(ctx, {x: 0, y: 0, width: canvas.width, height: canvas.height, method: "fill", color: gradient});
        // canvasDrawRect(ctx, {x: 114, y: 20, width: 426, height: 80, method: "fill", radius: 8, color: canvasStyle(ctx).rgba(0, 0, 0, 0.3)});
        // const avatar = await loadImage(member.displayAvatarURL({extension: "png", size: 512}));
        // canvasDrawImage(ctx, {image: avatar, x: 20, y: 20, radius: 40});
        // canvasSetFont(ctx, {family: "Montserrat", style: "bold", size: 30, textBaseLine: "alphabetic"})
        // canvasDrawText(ctx, {text: member.displayName, x: 130, y: 60, method: "fill", color: config.colors.white})
        
        // canvasSetFont(ctx, {family: "Montserrat", style: "bold", size: 12, textBaseLine: "alphabetic"})
        // ctx.filter = "blur(2px)"
        // canvasDrawText(ctx, {text: "Admin".toUpperCase(), x: 155, y: 90, method: "fill", color: config.colors.leaveRed})
        
        // const gradient = CanvasBuilder.gradient({ 
        //     startColor: "#401700", endColor: "#91C300", start: {x: 323, y: 110},  end: {x: 217, y: 130} 
        // });
        
        const canvas = new CanvasBuilder(560, 280)
        .drawRect({x: 0, y: 0, width: 560, height: 280, method: "fill", style: "#242733"})
        .drawRect({x: 114, y: 20, width: 426, height: 80, method: "fill", radius: 8, style: "rgba(0,0,0,0.3)"})
        .setFont({family: "Montserrat", style: "bold", size: 30, textBaseLine: "alphabetic"})
        .drawText({text: member.displayName, x: 130, y: 60, method: "fill", style: config.colors.white})
        .setFont({family: "Montserrat", style: "bold", size: 12, textBaseLine: "alphabetic"})
        .setFilter().dropShadow(2, 2, 1, CanvasBuilder.rgbaStyle(0, 0, 0, 0.3))
        .drawText({text: "Admin".toUpperCase(), x: 155, y: 90, method: "fill", style: config.colors.leaveRed})
        .clearFilter()
        .drawRect({x: 45, y: 120, width: 200, height: 20, method: "fill", style: "#60185E", radius: 12})
        .setFilter().dropShadow(0, 0, 16, "#FF2EFA")
        .drawRect({x: 45, y: 120, width: (40 / 100) * 200, height: 20, method: "fill", style: "#FF2EFA", radius: 12})
        .setFilter().opacity(30)
        .setGradient().linear({startColor: "#401700", endColor: "#C34600", start: {x: 323, y: 110},  end: {x: 323 + 220, y: 110 + 70}})
        .drawRect({x: 323, y: 110, width: 217, height: 70, method: "fill", radius: 8})
        .clearFilter()
        .drawText({text: "Carteira".toUpperCase(), x: 337, y: 130, method: "fill", style: config.colors.white})
        .drawImage({image: await loadImage(member.displayAvatarURL({size: 512, extension: "png"})), x: 20, y: 20, radius: 40})
        

        const buffer = canvas.getCanvas().toBuffer("image/png")

        const attach = new AttachmentBuilder(buffer, {name: "image.png"});

        interaction.editReply({files: [attach]});


    },
});