import { ActionRowBuilder, Attachment, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, Guild, TextChannel } from "discord.js";

import { DocumentPlayer, DocumentResource, ZunderResourceEditProps, ZunderResourceUploadProps } from "..";
import { config, db } from "../..";
import { findChannel } from "../functions";
export class ResourceManager {
    public static tempUpload: Map<string, ZunderResourceUploadProps> = new Map();
    public static tempEdit: Map<string, ZunderResourceEditProps> = new Map();
    public static tempReport: Map<string, string> = new Map();
    
    public static async findMessage(id: string, resource: DocumentResource, guild: Guild){
        //const guildManager = new GuildManager(guild);
        const channelName = `${resource.category.name}-${resource.category.subCategory}`;
        const channel = findChannel(guild, channelName, ChannelType.GuildText, config.resources.title);

        if (!channel) return undefined;
        return await channel.messages.fetch(id);
    }
    public static async edit(id: string, guild: Guild, props: ZunderResourceEditProps): Promise<{success: boolean, message: string}>{
        const resourceData = await db.resources.get(id) as DocumentResource | undefined;
        if (!resourceData) return {success: false, message: "O recurso não foi encontrado!"};
        
        const channelName = `${resourceData.category.name}-${resourceData.category.subCategory}`;
        
        const channel = findChannel(guild, channelName, ChannelType.GuildText);
        if (!channel) return {success: false, message: "O chat da mensagem não foi encontrado!"};
        
        const msg = await channel.messages.fetch(id);
        if (!msg) return {success: false, message: "A mensagem não foi encontrada!"};

        const { title, description, acessURL, thumbAttach, bannerAttach } = props;
        const embed = new EmbedBuilder(msg.embeds[0].data);

        const rowResource = new ActionRowBuilder<ButtonBuilder>({components: [
            new ButtonBuilder({url: resourceData.acessURL, label: "Acessar", style: ButtonStyle.Link}),
            new ButtonBuilder({customId: "resource-report-button", label: "Reportar", style: ButtonStyle.Danger}),
        ]});

        if (title) {
            embed.setTitle(title);
            resourceData.title = title;
        }
        if (description) {
            embed.setDescription(description);
            resourceData.description = description;
        }
        if (acessURL) {
            embed.setURL(acessURL);
            rowResource.components[0].setURL(acessURL);
            resourceData.acessURL = acessURL;
        }

        const files = msg.attachments.map(a => new AttachmentBuilder(a.url, {name: a.name}));

        function spliceFile(name: string){
            const index = files.findIndex(a => a.name == name);
            if (index) files.splice(index, 1);
        }

        if (thumbAttach === null) {
            embed.setThumbnail(null);
            delete resourceData.thumbURL;
            spliceFile("thumb.png");
        } else if (thumbAttach) {
            spliceFile("thumb.png");
            files.push(new AttachmentBuilder(thumbAttach.url, {name: "thumb.png"}));
            embed.setThumbnail("attachment://thumb.png");
        }
        
        if (bannerAttach === null) {
            embed.setImage(null);
            delete resourceData.bannerURL;
            spliceFile("banner.png");
        } else if (bannerAttach) {
            spliceFile("banner.png");
            files.push(new AttachmentBuilder(bannerAttach.url, {name: "banner.png"}));
            embed.setImage("attachment://banner.png");
        }
        
        const msgEdited = await msg.edit({embeds: [embed], components: [rowResource], files: (files.length < 1) ? [] : files});
        
        const embedData = msgEdited.embeds[0].data;

        if (embedData.thumbnail) resourceData.thumbURL = embedData.thumbnail.url;
        if (embedData.image) resourceData.bannerURL = embedData.image.url;

        await db.players.setData(id, resourceData);
        return {success: true, message: "O recurso foi editado com sucesso!"};
    }
    public static async delete(id: string, guild: Guild){

        const resource = await db.resources.get(id) as DocumentResource | undefined;
        if (!resource) return {success: false, message: "O recurso não foi encontrado!"};
        
        const msg = await ResourceManager.findMessage(id, resource, guild);
        if (!msg) return {success: false, message: "A mensagem não foi encontrada!"};

        const memberData = await db.players.get(resource.authorID) as DocumentPlayer | undefined;
        if (memberData && memberData.resources) {
            const indexToDelete = memberData.resources.findIndex(item => item.id === id);
            if (indexToDelete !== -1) memberData.resources.splice(indexToDelete, 1);
            db.players.setData(resource.authorID, memberData);
        }

        if (msg.hasThread) msg.thread?.delete();
        await db.resources.delete(id);
        msg.delete().catch(() => {});

        return {success: true, message: "O recurso foi editado com sucesso!"};
    }
    
}

export class ResourceBuilder {
    authorID: string;
    guildID: string;
    messageID?: string;
    title: string = "indefinido";
    description: string = "indefinido";
    acessURL: string = "indefinido";
    thumbAttach?: Attachment;
    bannerAttach?: Attachment;
    thumbURL?: string;
    bannerURL?: string;
    messageURL?: string;
    reports: Array<string> = new Array();
    category?: {
        name: string;
        subCategory: string; 
    };
    constructor(userID: string, guildID: string){
        this.authorID = userID;
        this.guildID = guildID;
    }
    public setTitle(title: string){
        this.title = title;
        return this;
    }
    public setDescription(description: string){
        this.description = description;
        return this;
    }
    public setAcessURL(acessURL: string){
        this.acessURL = acessURL;
        return this;
    }
    public setThumbURL(url: string | undefined){
        this.thumbURL = url;
        return this;
    }
    public setBannerURL(url: string | undefined) {
        this.bannerURL = url;
        return this;
    }
    public setCategory(category: string, subCategory: string){
        this.category = {
            name: category,
            subCategory: subCategory
        };
        return this;
    }
    public setThumbAttach(attach: Attachment){
        this.thumbAttach = attach;
        return this;
    }

    public setBannerAttach(attach: Attachment){
        this.bannerAttach = attach;
        return this;
    }

    public clearAttachs(){
        delete this.bannerAttach;
        delete this.thumbAttach;
        return this;
    }

    public setMessageID(messageID: string){
        this.messageID = messageID;
        return this;
    }
    public setMessageURL(messageURL: string){
        this.messageURL = messageURL;
        return this;
    }
}

export interface ResourceProps {
    title?: string;
    description?: string;
    acessURL?: string;
    thumb?: Attachment | null;
    banner?: Attachment | null;
}