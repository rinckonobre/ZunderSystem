export interface DocumentResource {
    title: string;
    description: string;
    acessURL: string;
    thumbURL?: string;
    bannerURL?: string;
    messageURL: string;
    guildID: string;
    reports: Array<{
        id: string,
        reason: string;
    }>;
    category: {
        name: string;
        subCategory: string; 
    };
    messageID: string;
    authorID: string;
}

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
    reports: Array<{ id: string; reason: string; }>
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