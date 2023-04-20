import { client } from "../../../app";
import { Event } from "../../../app/structs";


export default new Event({
	name: 'interactionCreate', run(interaction) {
		if (interaction.isModalSubmit()) {
			const { customId } = interaction;

			const clientModal = client.modals.get(customId);
			if (clientModal){
				clientModal(interaction);
				return;
			}
		};

		if (!interaction.isMessageComponent()) return;
		const { customId } = interaction;
	
		if (interaction.isButton()){
			const clientButton = client.buttons.get(customId);
			if (clientButton) {
				clientButton(interaction);
				return;
			};
		}
		if (interaction.isStringSelectMenu()){
			const clientButton = client.selects.get(customId);
			if (clientButton) {
				clientButton(interaction);
				return;
			};
		}
	}
})