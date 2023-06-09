import { ApplicationCommandOptionType, ApplicationCommandType, Events, GuildMember } from "discord.js";
import { client } from "../../..";
import { Command } from "../../../app/base";


export default new Command({
    name: "eventos",
    description: "Comando básico de eventos",
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    dmPermission: false,
    options: [
        {
            name: Events.GuildMemberAdd.toLowerCase(),
            description: "Emite o evento de novo membro no servidor",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "membro",
                    description: "Selecione o membro que deseja emitir este evento",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        },
        {
            name: Events.GuildMemberRemove.toLowerCase(),
            description: "Emite o evento de sáida de membro do servidor",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "membro",
                    description: "Selecione o membro que deseja emitir este evento",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        }
    ],
    async run(interaction) {        
        const { options } = interaction;
        const subCommand = options.getSubcommand();
        const mention = options.getMember("membro") as GuildMember;

        switch(subCommand){
            case Events.GuildMemberAdd.toLowerCase(): {
                client.emit(Events.GuildMemberAdd, mention);
                break;
            }
            case Events.GuildMemberRemove.toLowerCase(): {
                client.emit(Events.GuildMemberRemove, mention);
                break;
            }
        }
        interaction.reply({ephemeral: true, content: "Evento emitido"});

    },
});