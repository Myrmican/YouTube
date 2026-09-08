import { Events, MessageFlags, ModalSubmitInteraction } from "discord.js";

export default {
    name: Events.InteractionCreate,

    async execute(interaction: ModalSubmitInteraction) {
        if (!interaction.isModalSubmit()) return;

        if (interaction.customId !== "configDashboard") return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const usernameOption = interaction.fields.getTextInputValue("usernameOption");
        const formatUsername = usernameOption.trim().replaceAll("@", "");

        const filterOption = interaction.fields.getTextInputValue("filterOption");
        const filterKeywords = filterOption.split(",").map((keyword) => keyword.trim());
        
        filterKeywords.forEach((keyword) => {
            keyword.trim()
        });

        console.log(filterKeywords)

        await interaction.editReply({
            content: "You changed the config values!"
        });
    }
}