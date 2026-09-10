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
        const alertChannel = alertChannelOption?.first();

        const filterOption = interaction.fields.getTextInputValue("filterOption");
        const filterKeywords = filterOption.split(",").map((keyword) => keyword.trim());

        const filterTypeOption = interaction.fields.getStringSelectValues("filterTypeOption");
        let filterType = 1;
        switch (filterTypeOption[0]) {
            case "Blacklist":
                filterType = 1;
                break;
            case "Whitelist":
                filterType = 2;
                break;
        }
        
        filterKeywords.forEach((keyword) => {
            keyword.trim()
        });

        const finalFilter = filterKeywords.join("");

        const guildId = interaction.guild?.id || "0";

        const results = await db.execute({ sql: `SELECT * FROM config WHERE guildId = ?`, args: [guildId]})
        if (results.rows.length < 1) {
            await db.execute({
                sql: `
                INSERT INTO config (guildId)
                VALUES (?)`,
                args: [guildId]
            })

            return;
        }

        await db.execute({
            sql: `
            UPDATE config
            SET channelUsername = ?, alertChannelID = ?, filterType = ?, filterKeywords = ?
            WHERE guildId = ?`,
            args: [formatUsername, alertChannel?.id ?? "0", filterType, finalFilter, guildId]
        })

        await interaction.editReply({
            content: "You changed the config values!"
        });
    }
}