if (interaction.isModalSubmit() && interaction.customId === "form_set") {

  const nome = interaction.fields.getTextInputValue("nome");
  const id = interaction.fields.getTextInputValue("id");
  const cargo = interaction.fields.getTextInputValue("cargo");
  const crime = interaction.fields.getTextInputValue("crime");

  // 📥 canal onde chega o pedido (PRONTUÁRIO)
  const requestChannel = await client.channels.fetch("1495017395062964304");

  // 📤 canal de aprovação (LÍDERES)
  const approvalChannel = await client.channels.fetch("1495017575757910026");

  // 🧾 PRONTUÁRIO FORMATADO
  const prontuario = new EmbedBuilder()
    .setTitle("📁 PRONTUÁRIO - SOLICITAÇÃO DE SET")
    .setColor("#2b2d31")
    .addFields(
      {
        name: "👤 Nome:",
        value: `**${nome}**`,
        inline: true
      },
      {
        name: "🆔 ID:",
        value: `**${id}**`,
        inline: true
      },
      {
        name: "🎖️ Cargo Solicitado:",
        value: `**${cargo}**`,
        inline: false
      },
      {
        name: "📜 Descrição (RP/Crime):",
        value: `**${crime}**`,
        inline: false
      },
      {
        name: "📌 Jogador:",
        value: `<@${interaction.user.id}>`,
        inline: false
      }
    )
    .setFooter({ text: `Prontuário ID: ${id} • Polônia RP` });

  // 🔘 botões de aprovação
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${interaction.user.id}_${cargo}`)
      .setLabel("Aprovar")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`recusar_${interaction.user.id}_${cargo}`)
      .setLabel("Recusar")
      .setStyle(ButtonStyle.Danger)
  );

  // 📥 manda no canal de pedidos (prontuário bruto)
  await requestChannel.send({
    content: `📁 Novo prontuário recebido de <@${interaction.user.id}>`,
    embeds: [prontuario]
  });

  // 📤 manda no canal de aprovação dos líderes
  await approvalChannel.send({
    content: `🚨 **PEDIDO DE SET PENDENTE DE APROVAÇÃO**`,
    embeds: [prontuario],
    components: [row]
  });

  // ✅ resposta pro jogador
  return interaction.reply({
    content: "📨 Seu prontuário foi enviado para análise da liderança!",
    ephemeral: true
  });
}
