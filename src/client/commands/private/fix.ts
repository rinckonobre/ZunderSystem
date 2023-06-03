import { ApplicationCommandOptionType, ApplicationCommandType, GuildMember } from "discord.js";
import { Command } from "../../../app/base";
import { client, db } from "../../..";
import { BreakInteraction } from "../../../app/classes";
import { DocumentPlayer } from "../../../app/interfaces";

export default new Command({
    name: "fix",
    description: "fix bugs",
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    options: [
        {
            name: "resourceslist",
            description: "Fix a member resource list",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "mention",
                    description: "member to fix",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ],
        }
    ],
    async run(interaction) {
        if (!interaction.inCachedGuild()) return;

        const { member, options, guild } = interaction;

        switch(options.getSubcommand(true)){
            case "resourceslist":{
                await interaction.deferReply({ephemeral: true});
                if (guild.id !== client.mainGuildID){
                    new BreakInteraction(interaction, "Este comando só pode ser usado no servidor principal!", {replace: true});
                    return;
                }

                const mention = options.getMember("mention") as GuildMember;
                const mentionData = await db.players.get(mention.id) as DocumentPlayer | undefined;
                if (!mentionData) {
                    new BreakInteraction(interaction, `${mention} não está registrado!`, {replace: true});
                    return;
                }

                const snapshot = await db.resources.collection.where("authorID", "==", mention.id).get();
                if (snapshot.docs.length < 1) {
                    new BreakInteraction(interaction, `${mention} não tem recursos enviados`, {replace: true});
                    return;
                }

                await db.players.update(mention.id, "resources", {}, "delete");
                snapshot.docs.forEach(async doc => {
                    await db.players.update(mention.id, "resources", {id: doc.id}, "arrayUnion");
                });

                interaction.editReply({
                    content: `A listagem de recursos de ${mention} foi corrigida!`
                });
                return;
            }
        }
    },
});