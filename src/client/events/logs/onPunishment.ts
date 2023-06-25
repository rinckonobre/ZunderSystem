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

        switch(action){
            case AuditLogEvent.MemberKick:{
                systemRecords.create({
                    guild, title: "Membro expulso",
                    description: `${target} **@${target.username}**
                    
                    Motivo: \`${reason}\``,
                    color: config.colors.theme.danger,
                    mention: target,
                    staff: executor
                });
                break;
            }
            case AuditLogEvent.MemberBanAdd:{
                systemRecords.create({
                    guild, title: "Banimento aplicado",
                    description: `${target} **@${target.username}**
                    
                    Motivo: \`${reason}\``,
                    color: config.colors.theme.danger,
                    mention: target,
                    staff: executor
                });
                break;
            }
            case AuditLogEvent.MemberUpdate:{
                const change = changes[0];
                if (change.key == "communication_disabled_until"){
                    if (change.new && !change.old) {
                        systemRecords.create({
                            guild, title: "Castigo aplicado",
                            style: "Simple",
                            description: `${target} **@${target.username}**
                            
                            Motivo: \`${reason}\`
                            Expiração: ${time(~~ (new Date(String(change.new)).getTime() / 1000), TimestampStyles.RelativeTime)}
                            `,
                            color: config.colors.theme.danger,
                            mention: target,
                            staff: executor
                        });
                    }
                    break;
                }
                break;
            }
        }
    },
});