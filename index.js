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
const REQUEST_CHANNEL_ID = "1495026255756787722"; // prontuário (só após aprovação)
const APPROVAL_CHANNEL_ID = "1495017575757910026"; // aprovação

// 🤖 BOT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 📌 COMANDO
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel da Facção Polônia RP")
    .toJSON()
];

// 🚀 REGISTRO
const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
}

// 🎯 ONLINE
client.once("ready", () => {
  console.log(`🤖 Online como ${client.user.tag}`);
  registerCommands();
});

// =========================
// 📌 INTERAÇÕES
// =========================
client.on("interactionCreate", async (interaction) => {

  // 🟣 PAINEL
  if (interaction.isChatInputCommand() && interaction.commandName === "painelset") {

    const embed = new EmbedBuilder()
      .setTitle("🇵🇱 FAMÍLIA POLÔNIA RP")
      .setDescription("🇵🇱 Lealdade, respeito e poder — a Família Polônia domina o submundo.")
      .setColor("#0a0a0a");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("abrir_set")
        .setLabel("Entrar na Família")
        .setEmoji("🧾")
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  // =========================
  // 🧾 FORMULÁRIO
  // =========================
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Recrutamento Polônia RP");

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

  // =========================
  // 📩 ENVIO PARA APROVAÇÃO (SEM PRONTUÁRIO)
  // =========================
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const crime = interaction.fields.getTextInputValue("crime");

    const approvalChannel = await client.channels.fetch(APPROVAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("🚨 PEDIDO DE RECRUTAMENTO")
      .setColor("#ffaa00")
      .addFields(
        { name: "👤 Nome", value: `**${nome}**`, inline: true },
        { name: "🆔 ID", value: `**${id}**`, inline: true },
        { name: "🎖️ Função", value: `**Membro**`, inline: true },
        { name: "📜 Histórico", value: `**${crime}**`, inline: false },
        { name: "📌 Recruta", value: `<@${interaction.user.id}>`, inline: false }
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

    await approvalChannel.send({
      content: "🚨 Aguardando aprovação",
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: "📨 Pedido enviado para análise!",
      ephemeral: true
    });
  }

  // =========================
  // 🟢 APROVAR / ❌ RECUSAR
  // =========================
  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("aprovar_") || interaction.customId.startsWith("recusar_"))
  ) {

    const member = interaction.member;

    if (!member.roles.cache.has(LEADER_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Apenas líderes podem aprovar.",
        ephemeral: true
      });
    }

    const [action, userId] = interaction.customId.split("_");
    const guildMember = await interaction.guild.members.fetch(userId);

    // ❌ RECUSAR
    if (action === "recusar") {
      return interaction.reply({
        content: `❌ Pedido recusado para <@${userId}>`
      });
    }

    // ✅ APROVAR
    if (action === "aprovar") {

      await guildMember.roles.add(ROLE_SET_ID);

      const embed = interaction.message.embeds[0];

      const nomeRP = embed.fields.find(f => f.name === "👤 Nome").value.replace(/\*\*/g, "");
      const idRP = embed.fields.find(f => f.name === "🆔 ID").value.replace(/\*\*/g, "");
      const crime = embed.fields.find(f => f.name === "📜 Histórico").value.replace(/\*\*/g, "");

      const newNick = `${nomeRP} | ${idRP}`;

      try {
        await guildMember.setNickname(newNick);
      } catch (err) {
        console.log("Erro nickname:", err.message);
      }

      // 📁 PRONTUÁRIO (AGORA SIM)
      const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);

      const prontuario = new EmbedBuilder()
        .setTitle("📁 PRONTUÁRIO APROVADO")
        .setColor("#00ff88")
        .addFields(
          { name: "👤 Nome", value: `**${nomeRP}**`, inline: true },
          { name: "🆔 ID", value: `**${idRP}**`, inline: true },
          { name: "🎖️ Função", value: `**Membro**`, inline: true },
          { name: "📜 Histórico", value: `**${crime}**`, inline: false },
          { name: "✅ Aprovado por", value: `<@${interaction.user.id}>`, inline: false }
        );

      await requestChannel.send({
        content: "📁 Prontuário aprovado",
        embeds: [prontuario]
      });

      return interaction.reply({
        content:
          `✅ **APROVADO**\n\n` +
          `👤 ${nomeRP}\n` +
          `🆔 ${idRP}\n` +
          `✏️ ${newNick}`
      });
    }
  }
});

// 🔑 LOGIN
client.login(TOKEN);
