import { BaseInteraction, Events } from "discord.js";
import { client } from "../index";

export default {
    name: Events.InteractionCreate,

    async execute(interaction: BaseInteraction) {
        if (interaction.isChatInputCommand()) {
        
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: "There was an error executing this command!" });
            }
        } else if (interaction.isStringSelectMenu()) {
            
        }
    }
}