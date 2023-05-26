# Zunder System Bot

This bot was developed by @rinckonobre, to make administration and moderation of the Zunder community easier and more practical. We have a member control, registration system, entertainment and sharing commands. The systems that the server staff can use are made as intuitive as possible, so that it is simple to use, but also efficient.

### App directory
Everything related to the functioning of the application, functions, classes, interfaces and bases.

### Client directory
Everything that will be presented to users, such as commands, events and tasks

### Settings directory
An area to leave static settings that will be used elsewhere in the project

## Base
The structure of this bot is different from the common ones, it was thought out, it is possible to create "command components" in all commands.
That would be buttons, string and modal selection menus, which will be fixed on the server, which are more organized just below the command

For example, we can create a ticket command, where its use is restricted to staff, but we can create fixed buttons that anyone can use. In case we have a selection or modal menu also within that ticket system, we can add as well.

ticket command
- run function
  - buttons
    - open ticket button
    - close ticket button
  - string selects
    - ticket select category
  - modals
    - ticket form 
  
The functions of each component receive an interaction according to their type, so it is necessary to do some checks to keep everything in order.
The handler that sends interactions to these components is similar to a command handler.
At the time the bot is starting, it gets all the components from all the commands and puts them in an object where the key is the custom id of the component and the value is its function. So when a listener is created that waits for the "interactionCreate" event and all the initial checks are done there to obtain the function according to the custom id and execute according to the interaction

```ts
// Extended Client class method
const commandsFolders = readdirSync(commandsFolderPath);
commandsFolders.forEach(subFolder => {
    readdirSync(path.join(commandsFolderPath, subFolder))
    .filter(fileCondition).forEach(async fileName => {
        const command: CommandType = (await import(`../../client/commands/${subFolder}/${fileName}`))?.default;
        if (!command.name) return;
        const { name, buttons, stringSelects, modals } = command;

        this.commands.set(name, command);

        if (buttons) this.buttons = {...this.buttons, ...buttons};
        if (stringSelects) this.stringSelects = {...this.stringSelects, ...stringSelects};
        if (modals) this.modals = {...this.modals, ...modals};
    });
});
```
```ts
// Extended Client class method
this.on("interactionCreate", (interaction) => {
    if (interaction.isButton()){
        const onClick = this.buttons[interaction.customId];
        if (onClick) onClick(interaction);
        return;
    }
    if (interaction.isStringSelectMenu()){
        const onSelect = this.stringSelects[interaction.customId];
        if (onSelect) onSelect(interaction);
        return;
    }
    if (interaction.isModalSubmit()){
        const onSubmit = this.modals[interaction.customId];
        if (onSubmit) onSubmit(interaction);
        return;
    }
})
```

With this to create a command component is quite simple:

```ts
// Command file
export default new Command({
    name: "ticket",
    description: "Ticket command",
    type: ApplicationCommandType.ChatInput,
    visibility: "staff",
    async run(interaction) {
        // setup ticket channel
    },
    buttons:{
        "ticket-open-button": async interaction => {
            interaction.reply({content: "your ticket has been opened" })
            // other process
        },
        "ticket-close-button": async interaction => {
            interaction.reply({content: "your ticket has been closed" })
            // other process
        }
    },
    modals: {
        "ticket-form-modal": async interaction => {
            const { fields } = interaction;
            const nameField = fields.getTextInputValue("name");
            // ...
        }
    }
});
```