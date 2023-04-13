import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder, Guild, GuildMember, UserContextMenuCommandInteraction } from "discord.js";
import { config } from "../..";
import { registers } from "../../jsons";
import { CanvasBuilder, CanvasFontBuilder, DocumentPlayer, ServerManager, TextUtils } from "../../structs";
import { loadImage } from "@napi-rs/canvas";

function emoji(guild: Guild, name: string){
    return ServerManager.findEmoji(guild, name);
}

// function setup(member: GuildMember, memberData: DocumentPlayer){
//     const register = registers[memberData.registry!.type].find(r => r.level == memberData.registry!.level)!;

//     return new EmbedBuilder()
//     .setThumbnail(member.displayAvatarURL())
//     .setColor(register.color as ColorResolvable)
//     .setDescription(
//     `> ${emoji(member.guild, register.emoji)} ${member.roles.highest} ${member}
//     🏷️ Nick: \` ${memberData.registry!.nick} \`
//     Tipo de registro: ${emoji(member.guild, memberData.registry!.type) || ""} ${memberData.registry!.type}
//     Dispositivo: ${emoji(member.guild, memberData.registry!.device) || ""} ${memberData.registry!.device} `)
// }

type InteractionTypes = ChatInputCommandInteraction | UserContextMenuCommandInteraction | ButtonInteraction

export const systemProfile = {
    async showMember(interaction: InteractionTypes, member: GuildMember, memberData: DocumentPlayer){

        const { registry } = memberData;
        const register = registers[registry.type].find(r => r.level == registry.level) || registers[registry.type][0];

        await interaction.deferReply({fetchReply: true});

        const blackGlassColor = CanvasBuilder.rgbaStyle(0, 0, 0, 0.3)

        const canvas = new CanvasBuilder(1200, 600);

        const canvasFont = new CanvasFontBuilder({
            family: "Montserrat", style: "bold", size: 60, textBaseLine: "top", textAlign: "start"
        });
        // background
        canvas
        .setGradient().linear({
            start: {x: 355, y: 0}, end: {x: 670, y: 600},
            startColor: "#393A3F", endColor: "#242733"
        })
        .drawRect({ method: "fill", x: 0, y: 0, width: 1200, height: 600 })
        .setStyle({style: config.colors.white});

        // Block #1 - Profile avatar
        const avatar = await loadImage(member.displayAvatarURL({extension: "png", size: 1024}))
        canvas.drawImage({image: avatar, x: 40 + 10, y: 40, radius: 80});

        // Block #2 - Member Infos
        const registerIcon = await loadImage(register.iconUrl);
        canvas
        .drawRect({ method: "fill", x: 224, y: 40, width: 556, height: 160, radius: 16, style: blackGlassColor })
        .setFont(canvasFont.data)
        .drawText({ method: "fill", x: 254, y: 76, text: member.displayName, style: "#E7E7E7"})
        .setFont(canvasFont.setSize(26).data)
        .drawText({ method: "fill", x: 300, y: 156, text: register.name.toUpperCase(), style: register.color })
        .drawRect({ method: "fill", x: 654, y: 148, width: 100, height: 36, radius: 16, style: blackGlassColor })
        .setFont(canvasFont.setStyle("light").setSize(22).data)
        .drawText({ method: "fill", x: 668, y: 156, text: `#${member.user.discriminator}`, style: config.colors.white })
        .drawImage({image: registerIcon, x: 254, y: 148, size: 18})

        // Block #3 - Interaction
        const level = memberData.interaction?.level || 0;
        const xp = memberData.interaction?.xp || 0
        const xpRequired = (level > 0) ? level * 982 : 440;

        canvas
        .drawRect({ method: "fill", x: 40, y: 220, width: 360, height: 160, radius: 16, style: blackGlassColor })
        .setFont(canvasFont.setStyle("bold").setSize(20).data)
        .drawText({ method: "fill", x: 60, y: 238, text: "interação".toUpperCase(), style: config.colors.white })
        .drawRect({ method: "fill", x: 55, y: 260, width: 330, height: 22, radius: 10, style: "#8B0088" });

        const progressWidth = (xp / xpRequired) * 330;

        if (progressWidth > 14){
            canvas.setFilter().dropShadow(0, 0, 20, "#ED09E8")
            .drawRect({
                method: "fill", x: 55, y: 260,
                width: progressWidth, height: 22, radius: 10, style: "#ED09E8"
            })
            .clearFilter()
        }

        canvas
        .setFont(canvasFont.setStyle("regular").setSize(22).data)
        .drawText({
            method: "fill", x: 90, y: 295,
            text: `Level: ${level}`.toUpperCase(), style: config.colors.white
        })
        .setFont(canvasFont.setAlign("end").data)
        .drawText({
            method: "fill", x: 380, y: 295,
            text: `Xp: ${xp} / ${xpRequired}`.toUpperCase(), style: config.colors.white
        })

        
        
        // Block #3 Work
        const roleWork = member.guild.roles.cache.find(r => r.name == config.guild.roles.functional.work);
        if (roleWork && member.roles.cache.has(roleWork.id)){
            const level = memberData.work?.level || 0;
            const xp = memberData.work?.xp || 0
            const xpRequired = (level > 0) ? level * 982 : 440;

            canvas
            .drawRect({
                method: "fill", x: 40, y: 220 + 180,
                width: 360, height: 160, radius: 16, style: CanvasBuilder.rgbaStyle(0, 0, 0, 0.3)
            })
            .setFont(canvasFont.setStyle("bold").setSize(20).setAlign("start").data)
            .drawText({
                method: "fill", x: 60, y: 238 + 180,
                text: "trabalho".toUpperCase(), style: config.colors.white
            })
            .drawRect({
                method: "fill", x: 55, y: 260 + 180,
                width: 330, height: 22, radius: 10, style: "#008B40"
            });
            
            const workProgressWidth = (xp / xpRequired) * 330;
    
            if (workProgressWidth > 14){
                canvas.setFilter().dropShadow(0, 0, 20, "#09ED64")
                .drawRect({
                    method: "fill", x: 55, y: 260 + 180,
                    width: workProgressWidth, height: 22, radius: 10, style: "#09ED64"
                })
                .clearFilter()
            }
    
            canvas
            .setFont(canvasFont.setStyle("regular").setSize(22).data)
            .drawText({
                method: "fill", x: 90, y: 295 + 180,
                text: `Level: ${level}`.toUpperCase(), style: config.colors.white
            })
            .setFont(canvasFont.setAlign("end").data)
            .drawText({
                method: "fill", x: 380, y: 295 + 180,
                text: `Xp: ${xp} / ${xpRequired}`.toUpperCase(), style: config.colors.white
            })
        } else {
            canvas
            .drawRect({
                method: "fill", x: 40, y: 220 + 180,
                width: 360, height: 160, radius: 16, style: CanvasBuilder.rgbaStyle(0, 0, 0, 0.1)
            })
        }


        const files: Array<AttachmentBuilder> = []
        files.push(new AttachmentBuilder(canvas.getCanvas().toBuffer("image/png"), {name: "profile.png"}));

        const rows = [
            new ActionRowBuilder<ButtonBuilder>()
        ]

        const buttons = {
            config: new ButtonBuilder({customId: "profile-config-button", label: "Configurações", emoji: "⚙️", style: ButtonStyle.Secondary}),
            close: new ButtonBuilder({customId: "profile-close-button", label: "Fechar", style: ButtonStyle.Danger})
        }

        rows[0].setComponents(buttons.config, buttons.close);

        if (interaction instanceof ButtonInteraction) {
            interaction.update({content: `[ ](${interaction.user.id})`, files, components: [rows[0]]})
        } else {
            interaction.editReply({content: `[ ](${interaction.user.id})`,files, components: [rows[0]]})
        }
    }
    // showMember(interaction: CommandTypes, member: GuildMember, memberData: DocumentPlayer){

    //     const embed = setup(member, memberData)
    //     const guild = member.guild

    //     const level = memberData.interaction?.level || 0;
    //     const xp = memberData.interaction?.xp || 0;
    //     const xpRequired = (level > 0) ? level * 982 : 440;

    //     const coins = memberData.wallet?.coins || 0;
    //     const coinsLimit = memberData.config?.limits?.coins || 20000;

    //     // ===========
    //     embed.addFields({name: "\u200b", inline: true, value: 
    //     `> ${emoji(guild, "interactionLevel")} Nível de interação: \` ${level} \`
    //     > ${emoji(guild, "interactionXp")} Experiência: \` ${xp} / ${xpRequired} \` 
    //     > ${TextUtils.progressBar(xp, xpRequired)} **${TextUtils.progresPercentage(xp, xpRequired).toFixed(0)}%** 
    //     `})
    //     // Moedas;
    //     .addFields({name: "\u200b", inline: true, value: 
    //     `> ${emoji(guild, "coins")} Moedas: \` ${coins}/${coinsLimit} \`
    //     > \u200b
    //     `})
    //     // Statistics
    //     .addFields({name: "\u200b", value: 
    //     `📁 Recursos postados: ${memberData.resources?.length || 0}
    //     ✉️ Mensagens enviadas: ${memberData.stats?.msg || 0}
    //     🎉 Eventos:  ${memberData.stats?.events || 0} `})
    //     // ===========
    //     const roleShare = ServerManager.findRole(guild, config.guild.roles.functional.share)!
    //     const roleSupporter = ServerManager.findRole(guild, config.guild.roles.functional.supporter)!

    //     if (member.roles.cache.has(roleSupporter.id)) {
    //         embed.addFields({ name: "Apoiador(a) Zunder", inline: true, value: 
    //         `> ${emoji(guild, "supporter")} Valor total: ${memberData.stats?.donated || 0} reais
    //         `})
    //     }
    //     if (member.roles.cache.has(roleShare.id)) {
    //         embed.addFields({ name: "🔗 Compartilhamento", inline: true, value: 
    //         `> Total de postagens: ${memberData.stats?.shares || 0}
    //         `})
    //     }
    //     // ===========

    //     
    // }
}