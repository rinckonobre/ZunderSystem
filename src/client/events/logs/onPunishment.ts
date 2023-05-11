import { AuditLogEvent, TimestampStyles, User, time } from "discord.js";
import { Event } from "../../../app/base";
import { systemRecords } from "../../../app/functions";
import { config } from "../../..";

export default new Event({
    name: "guildAuditLogEntryCreate",
    run(auditLogEntry, guild) {
        const { action, reason, executor, target: targetRaw, targetType, changes } = auditLogEntry;
        
        if (targetType !== "User" || executor === null) return;
        const target = targetRaw as User;

        if (action === AuditLogEvent.MemberKick){
            systemRecords.create({
                guild, title: "Membro expulso",
                description: `${target} **${target.tag}**
                
                Motivo: \`${reason}\``,
                color: config.colors.danger,
                mention: target,
                staff: executor
            });
            return;
        }

        if (action === AuditLogEvent.MemberBanAdd){
            systemRecords.create({
                guild, title: "Banimento aplicado",
                description: `${target} **${target.tag}**
                
                Motivo: \`${reason}\``,
                color: config.colors.danger,
                mention: target,
                staff: executor
            });
            return;
        }



        if (action === AuditLogEvent.MemberUpdate){
            const change = changes[0];

            if (change.key == "communication_disabled_until"){

                if (change.new && !change.old) {
                    systemRecords.create({
                        guild, title: "Castigo aplicado",
                        style: "Simple",
                        description: `${target} **${target.tag}**
                        
                        Motivo: \`${reason}\`
                        Expiração: ${time(~~ (new Date(String(change.new)).getTime() / 1000), TimestampStyles.RelativeTime)}
                        `,
                        color: config.colors.danger,
                        mention: target,
                        staff: executor
                    });
                }
                
                return;
            }

            // systemRecords.create({
            //     guild, title: "Banimento aplicado",
            //     description: `${target} **${target.tag}**
                
            //     Motivo: \`${reason}\``,
            //     color: config.colors.danger,
            //     mention: target,
            //     staff: executor
            // });
            return;
        }
        


    },
});