import { Attachment } from "discord.js";

export class Files {
    public static checkAttachmentMbSize(attachment: Attachment, comparator: "<" | "==" | ">" | "!=", size: number){
        const attachmentSize = attachment.size / 1024 / 1024
        switch(comparator){
            case ">": return attachmentSize > size;
            case "<": return attachmentSize < size;
            case "==": return attachmentSize == size;
            default: return attachmentSize != size;
        }
    }
}