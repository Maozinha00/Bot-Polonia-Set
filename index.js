if (
  interaction.isButton() &&
  (interaction.customId.startsWith("aprovar_") ||
   interaction.customId.startsWith("recusar_") ||
   interaction.customId.startsWith("remover_"))
) {

  const member = interaction.member;

  if (!member.roles.cache.has(LEADER_ROLE_ID)) {
    return interaction.reply({
      content: "❌ Apenas líderes podem usar isso.",
      ephemeral: true
    });
  }

  const [action, userId] = interaction.customId.split("_");
  const guildMember = await interaction.guild.members.fetch(userId);

  const embedMsg = interaction.message.embeds[0];

  const nomeRP = embedMsg.fields.find(f => f.name === "👤 Nome").value.replace(/\*\*/g, "");
  const idRP = embedMsg.fields.find(f => f.name === "🆔 ID").value.replace(/\*\*/g, "");
  const crime = embedMsg.fields.find(f => f.name === "📜 Histórico").value.replace(/\*\*/g, "");

  const prontuarioID = Math.floor(Math.random() * 99999);

  // =========================
  // ❌ RECUSAR
  // =========================
  if (action === "recusar") {

    const newEmbed = EmbedBuilder.from(embedMsg)
      .setColor("#ff0000")
      .setFooter({ text: `❌ Recusado por ${interaction.user.tag}` });

    await interaction.update({ embeds: [newEmbed], components: [] });

    return;
  }

  // =========================
  // 🟢 APROVAR
  // =========================
  if (action === "aprovar") {

    await guildMember.roles.add(ROLE_SET_ID);

    const newNick = `${nomeRP} | ${idRP}`;

    try {
      await guildMember.setNickname(newNick);
    } catch {}

    const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);

    const prontuario = new EmbedBuilder()
      .setTitle(`📁 PRONTUÁRIO #${prontuarioID}`)
      .setColor("#00ff88")
      .addFields(
        { name: "👤 Nome", value: `**${nomeRP}**`, inline: true },
        { name: "🆔 ID", value: `**${idRP}**`, inline: true },
        { name: "🎖️ Função", value: `**Membro**`, inline: true },
        { name: "📜 Histórico", value: `**${crime}**`, inline: false },
        { name: "👮 Aprovado por", value: `<@${interaction.user.id}>`, inline: false }
      )
      .setFooter({ text: "Sistema Premium • Polônia RP" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`remover_${userId}`)
        .setLabel("Remover Set")
        .setStyle(ButtonStyle.Danger)
    );

    await requestChannel.send({
      content: "📁 Prontuário criado",
      embeds: [prontuario],
      components: [row]
    });

    const updated = EmbedBuilder.from(embedMsg)
      .setColor("#00ff88")
      .setFooter({ text: `✅ Aprovado por ${interaction.user.tag}` });

    await interaction.update({ embeds: [updated], components: [] });

    return;
  }

  // =========================
  // 🔴 REMOVER SET
  // =========================
  if (action === "remover") {

    await guildMember.roles.remove(ROLE_SET_ID);

    try {
      await guildMember.setNickname(null);
    } catch {}

    return interaction.reply({
      content: `🔴 Set removido de <@${userId}>`,
      ephemeral: true
    });
  }
}
