import { ApplicationCommandOptionType, ApplicationCommandType, GuildMember } from "discord.js";
import { Command, DocumentPlayer, DocumentPlayerPaths } from "../../structs";
import { devices, registries } from "../../jsons";
import { db } from "../..";

export default new Command({
    name: "change",
    description: "Change member data",
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    options: [
        {
            name: "register",
            description: "Change register member data",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "level",
                    description: "Change register level member data",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "member",
                            description: "Mention member",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "value",
                            description: "Register level",
                            type: ApplicationCommandOptionType.Integer,
                            choices:  [1,2,3,4,5].map(n => ({name: `${n}`, value: n})),
                            required: true
                        }
                    ]
                },
                {
                    name: "type",
                    description: "Change register type member data",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "member",
                            description: "Mention member",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "value",
                            description: "Register type",
                            type: ApplicationCommandOptionType.String,
                            choices: ["discord", "zunder"].map(n => ({name: `${n}`, value: n})),
                            required: true
                        }
                    ]
                },
                {
                    name: "device",
                    description: "Change register device member data",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "member",
                            description: "Mention member",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "value",
                            description: "Register device",
                            type: ApplicationCommandOptionType.String,
                            choices: devices.map(d => ({name: `${d.name}`, value: d.id})),
                            required: true
                        }
                    ]
                },
                {
                    name: "nick",
                    description: "Change register nick member data",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "member",
                            description: "Mention member",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "value",
                            description: "Register nick",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                }
            ],
        },
        {
            name: "wallet",
            description: "Change wallet member data",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "coins",
                    description: "Change wallet coins member data",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "member",
                            description: "Mention member",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "action",
                            description: "Action",
                            type: ApplicationCommandOptionType.String,
                            choices: [
                                {name: "[+] Add", value: "add"},
                                {name: "[.] Set", value: "set"},
                                {name: "[-] Remove", value: "remove"},
                            ],
                            required: true
                        },
                        {
                            name: "value",
                            description: "Wallet coins",
                            type: ApplicationCommandOptionType.Number,
                            required: true
                        }
                    ]
                }
            ],
        }
    ],
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
        const { member, guild, channel } = interaction;

        await interaction.deferReply({ephemeral: true})

        switch (options.getSubcommandGroup(true)){
            case "register": {
                const mention = options.getMember("member") as GuildMember;
                let content = "> ";
                
                switch(options.getSubcommand(true)){
                    case "level":{
                        const value = options.getInteger("value", true);
                        const path: DocumentPlayerPaths = "registry.level"
                        await db.players.update(mention.id, path, value);
                        content = `O nível de registro de ${mention} foi alterado para ${value}`
                        break;
                    }
                    case "type":{
                        const value = options.getString("value", true);
                        const path: DocumentPlayerPaths = "registry.type"
                        await db.players.update(mention.id, path, value);
                        content = `O tipo de registro de ${mention} foi alterado para ${value}`
                        break;
                    }
                    case "device":{
                        const value = options.getString("value", true);
                        const path: DocumentPlayerPaths = "registry.device"
                        await db.players.update(mention.id, path, value);
                        content = `O dispositivo de registro de ${mention} foi alterado para ${value}`
                        break;
                    }
                    case "nick":{
                        const value = options.getString("value", true);
                        const path: DocumentPlayerPaths = "registry.nick"
                        await db.players.update(mention.id, path, value);
                        content = `O nick de registro de ${mention} foi alterado para ${value}`
                        break;
                    }
                }
                
                interaction.editReply({content})
                return;
            }
            case "wallet":{
                switch(options.getSubcommand(true)){
                    case "coins":{
                        const mention = options.getMember("member") as GuildMember;
                        const action = options.getString("action", true) as "add" | "set" | "remove";
                        const value = options.getNumber("value", true);
                        const path: DocumentPlayerPaths = "wallet.coins"
                        
                        let content = "> ";
                        const mentionData = await db.players.get(member.id) as DocumentPlayer | undefined;;
                        const coins = mentionData?.wallet?.coins || 0;

                        switch(action){
                            case "add":{
                                await db.players.update(member.id, path, value, "increment");
                                content = `Foram adicionadas ${value} moedas na carteira de ${mention}`
                                break;
                            }
                            case "set":{
                                await db.players.update(member.id, path, value);
                                content = `Foram defindas ${value} moedas na carteira de ${mention}`
                                break;
                            }
                            case "remove":{
                                await db.players.update(member.id, path, coins - value);
                                content = `Foram removidas ${value} moedas da carteira de ${mention}`
                                break;
                            }
                        }
                        interaction.editReply({content});
                        return;
                    }
                }
                return;
            }
        }
    },
})