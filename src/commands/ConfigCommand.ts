import { ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, ChannelSelectMenuBuilder, ChannelType } from "discord.js";
import { db } from "../index";

export default {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Set up your server to use the YouTube bot"),

    async execute(interaction: ChatInputCommandInteraction) {

        const guildId = interaction.guildId
        const results = await db.execute({ sql: `SELECT * FROM config WHERE guildId = ?`, args: [guildId]})
        const row: any = results.rows[0];
        const modal = new ModalBuilder().setCustomId("configDashboard").setTitle("YouTube bot config");

        const usernameOption = new TextInputBuilder()
            .setCustomId("usernameOption")
            .setStyle(TextInputStyle.Short)
            .setValue(row.channelUsername)
            .setRequired(true)

        const usernameOptionLabel = new LabelBuilder()
            .setLabel('YT Username')
            .setDescription('The username of the channel to notify about videos from - URLs are not accepted, only usernames')
            .setTextInputComponent(usernameOption);

        const filterOption = new TextInputBuilder()
            .setCustomId("filterOption")
            .setStyle(TextInputStyle.Paragraph)

        const filterOptionLabel = new LabelBuilder()
            .setLabel('Filter keywords')
            .setDescription('The keywords to filter, seperated by comma. Filter is checked against the title')
            .setTextInputComponent(filterOption);

        const alertChannelOption = new ChannelSelectMenuBuilder()
            .setCustomId("alertChannel")
            .setChannelTypes(
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            )
            .setDefaultChannels(row.alertChannelID);

        const alertChannelOptionLabel = new LabelBuilder()
            .setLabel('Alert channel')
            .setDescription('The channel to send videos to')
            .setChannelSelectMenuComponent(alertChannelOption);

        const filterTypeOption = new StringSelectMenuBuilder()
            .setCustomId('filterTypeOption')
            .setRequired(true)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Blacklist')
                    .setValue('blacklist')
                    .setDefault(true),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Whitelist')
                    .setValue('whitelist'),
            );

        const filterTypeLabel = new LabelBuilder()
            .setLabel("Filter type")
            .setDescription("Blacklist blocks videos matching the filter, Whitelist only sends videos matching the filter")
            .setStringSelectMenuComponent(filterTypeOption)

        modal.addLabelComponents(usernameOptionLabel, filterTypeLabel, alertChannelOptionLabel, filterOptionLabel);

        await interaction.showModal(modal);
    }
}