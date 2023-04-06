import { Attachment } from "discord.js";

export interface ZunderResourceUploadProps {
    authorID: string;
    guildID: string;
    messageID?: string;
    title: string;
    description: string;
    acessURL: string;
    thumbAttach?: Attachment;
    bannerAttach?: Attachment;
    thumbURL?: string;
    bannerURL?: string;
    messageURL?: string;
    reports: Array<{
        id: string;
        reason: string;
    }>
    category?: {
        name: string;
        subCategory: string; 
    }
}

export interface ZunderResourceEditProps {
    title?: string;
    description?: string;
    acessURL?: string;
    thumbAttach?: Attachment | null;
    bannerAttach?: Attachment | null;
}