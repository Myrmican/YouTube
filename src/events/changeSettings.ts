import { Events, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { db } from "../index"

export default {
    name: Events.InteractionCreate,

    async execute(interaction: ModalSubmitInteraction) {
        if (!interaction.isModalSubmit()) return;

        if (interaction.customId !== "configDashboard") return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const usernameOption = interaction.fields.getTextInputValue("usernameOption");
        const formatUsername = usernameOption.trim().replaceAll("@", "");

        const alertChannelOption = interaction.fields.getSelectedChannels("alertChannel");
        console.log(alertChannelOption);

        const filterOption = interaction.fields.getTextInputValue("filterOption");
        const filterKeywords = filterOption.split(",").map((keyword) => keyword.trim());
        
        filterKeywords.forEach((keyword) => {
            keyword.trim()
        });

        await db.execute({
            sql: `
            UPDATE config
            SET channelUsername = ?, alertChannel = ?`,
            args: [formatUsername]
        })

        await interaction.editReply({
            content: "You changed the config values!"
        });
    }
}