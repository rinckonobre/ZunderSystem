import { CommandInteractionOptionResolver } from "discord.js";
import { client } from "../..";
import { Event } from "../../structs";

export default new Event({
    name: 'interactionCreate', run(interaction) {
        if (interaction.isAutocomplete()){
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            const options = interaction.options as CommandInteractionOptionResolver
    
            if (command.autcomplete) command.autcomplete({ client, interaction, options });
            return;
        }

        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return interaction.reply({ ephemeral: true, content: 'Este comando ainda não foi configurado!' });
        const options = interaction.options as CommandInteractionOptionResolver

        command.run({ client, interaction, options });
    }
})