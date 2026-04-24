if (interaction.isModalSubmit() && interaction.customId === "form_set") {

  const nome = interaction.fields.getTextInputValue("nome");
  const id = interaction.fields.getTextInputValue("id");
  const experiencia = interaction.fields.getTextInputValue("experiencia");

  const channel = await interaction.guild.channels.fetch(APPROVAL_CHANNEL_ID).catch(() => null);

  if (!channel) {
    return interaction.reply({
      content: "❌ Canal de análise não encontrado.",
      flags: 64
    });
  }

  const embed = new EmbedBuilder()
    .setColor("#facc15")
    .setTitle("📋 NOVO CADASTRO")
    .addFields(
      { name: "👤 Nome", value: nome },
      { name: "🆔 ID", value: id },
      { name: "🩺 Experiência", value: experiencia },
      { name: "📌 Discord", value: `<@${interaction.user.id}>` }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${interaction.user.id}`)
      .setLabel("Aprovar")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`recusar_${interaction.user.id}`)
      .setLabel("Recusar")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds: [embed], components: [row] });

  // =========================
  // 💌 DM OBRIGATÓRIO
  // =========================
  const invite = "https://discord.gg/y6tJAK3fF5";

  try {
    await interaction.user.send(
`🏥 **HOSPITAL BELLA - INSTRUÇÃO OBRIGATÓRIA**

📌 Para continuar seu processo de recrutamento, você precisa entrar no servidor abaixo:

🔗 ${invite}

⚠️ Isso é obrigatório para validação do seu cadastro.

Boa sorte no processo! 👨‍⚕️`
    );
  } catch (err) {
    console.log("❌ Não foi possível enviar DM para:", interaction.user.tag);
  }

  return interaction.reply({
    content: "📨 Enviado para análise! Verifique seu privado 📩",
    flags: 64
  });
}
