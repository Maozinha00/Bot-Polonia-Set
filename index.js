import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

// 🔐 CONFIG
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const LEADER_ROLE_ID = process.env.LEADER_ROLE_ID;
const ROLE_SET_ID = process.env.ROLE_SET_ID;

// 📌 CANAIS
const REQUEST_CHANNEL_ID = "1495178025602515177";
const APPROVAL_CHANNEL_ID = "1495790507182522450";

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// 📌 COMANDO SLASH
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel Polônia RP")
    .toJSON()
];

// 🚀 REGISTRO DE COMANDO
const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`🤖 Online: ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash command /painelset registrado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao registrar comando:", err);
  }
});

// =========================
// 📌 INTERAÇÕES
// =========================
client.on("interactionCreate", async (interaction) => {

  // ===== COMANDO =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setTitle("🇵🇱 FAMÍLIA POLÔNIA RP")
        .setDescription("Sistema de recrutamento oficial da organização.")
        .setColor("#000000");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_set")
          .setLabel("📋 Entrar na Família")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // ===== BOTÃO =====
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Recrutamento Polônia");

    const nome = new TextInputBuilder()
      .setCustomId("nome")
      .setLabel("Nome RP")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const id = new TextInputBuilder()
      .setCustomId("id")
      .setLabel("ID no servidor")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const crime = new TextInputBuilder()
      .setCustomId("crime")
      .setLabel("Histórico RP")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nome),
      new ActionRowBuilder().addComponents(id),
      new ActionRowBuilder().addComponents(crime)
    );

    return interaction.showModal(modal);
  }

  // ===== MODAL =====
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const crime = interaction.fields.getTextInputValue("crime");

    const approvalChannel = await client.channels.fetch(APPROVAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("🚨 NOVO RECRUTAMENTO")
      .setColor("#ffaa00")
      .addFields(
        { name: "👤 Nome", value: nome, inline: true },
        { name: "🆔 ID", value: id, inline: true },
        { name: "📜 Histórico", value: crime, inline: false },
        { name: "📌 Recruta", value: `<@${interaction.user.id}>`, inline: false }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprovar_${interaction.user.id}`)
        .setLabel("✅ Aprovar")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`recusar_${interaction.user.id}`)
        .setLabel("❌ Recusar")
        .setStyle(ButtonStyle.Danger)
    );

    await approvalChannel.send({
      content: "🚨 Pedido aguardando análise",
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: "📨 Pedido enviado!",
      ephemeral: true
    });
  }

  // ===== APROVAR / RECUSAR =====
  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("aprovar_") || interaction.customId.startsWith("recusar_"))
  ) {

    if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Apenas líderes podem aprovar.",
        ephemeral: true
      });
    }

    const [action, userId] = interaction.customId.split("_");
    const member = await interaction.guild.members.fetch(userId);

    const embed = interaction.message.embeds[0];

    const nome = embed.fields.find(f => f.name === "👤 Nome").value;
    const id = embed.fields.find(f => f.name === "🆔 ID").value;

    // ❌ RECUSAR
    if (action === "recusar") {
      await member.send("❌ Seu pedido foi recusado.").catch(() => {});
      return interaction.reply({ content: `❌ Recusado: <@${userId}>` });
    }

    // ✅ APROVAR
    if (action === "aprovar") {

      await member.roles.add(ROLE_SET_ID);

      const nick = `${nome} | ${id}`;
      try {
        await member.setNickname(nick);
      } catch {}

      await member.send("✅ Você foi aceito na Família Polônia!").catch(() => {});

      const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);

      await requestChannel.send(
`📁 **PRONTUÁRIO POLÔNIA**

━━━━━━━━━━━━━━
👤 Nome: ${nome}
🆔 ID: ${id}
👮 Aprovado por: <@${interaction.user.id}>
━━━━━━━━━━━━━━`
      );

      return interaction.reply({
        content:
          `✅ APROVADO\n` +
          `👤 ${nome}\n` +
          `🆔 ${id}\n` +
          `✏️ Nick: ${nick}`
      });
    }
  }
});

// 🔑 LOGIN
client.login(TOKEN);

// 💥 ANTI-CRASH
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
