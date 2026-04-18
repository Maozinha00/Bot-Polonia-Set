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
const REQUEST_CHANNEL_ID = "1495026255756787722";
const APPROVAL_CHANNEL_ID = "1495017575757910026";

// 🤖 BOT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 📌 COMANDO
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel de solicitação de set")
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
      .setTitle("🇵🇱 PAINEL DE SET - POLÔNIA RP")
      .setDescription(
        "Clique no botão abaixo para solicitar seu set.\n\n" +
        "📌 Nome RP, ID, Cargo e descrição obrigatórios\n" +
        "⚠️ Pedidos falsos serão recusados"
      )
      .setColor("#ff0000");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("abrir_set")
        .setLabel("Solicitar Set")
        .setEmoji("🧾")
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  // =========================
  // 🧾 BOTÃO + MODAL
  // =========================
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Solicitação de Set");

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

    const cargo = new TextInputBuilder()
      .setCustomId("cargo")
      .setLabel("Cargo desejado")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const crime = new TextInputBuilder()
      .setCustomId("crime")
      .setLabel("Descrição RP / Crime")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nome),
      new ActionRowBuilder().addComponents(id),
      new ActionRowBuilder().addComponents(cargo),
      new ActionRowBuilder().addComponents(crime)
    );

    return interaction.showModal(modal);
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
        content: "❌ Apenas líderes podem aprovar pedidos.",
        ephemeral: true
      });
    }

    const [action, userId, cargo] = interaction.customId.split("_");

    const guildMember = await interaction.guild.members.fetch(userId);

    // ❌ RECUSAR
    if (action === "recusar") {
      return interaction.reply({
        content: `❌ Pedido recusado para <@${userId}>`
      });
    }

    // =========================
    // ✅ APROVAR (NICKNAME SIMPLES)
    // =========================
    if (action === "aprovar") {

      await guildMember.roles.add(ROLE_SET_ID);

      const nomeAtual = guildMember.displayName || "Jogador";

      // ✏️ FORMATO FINAL: Nome | ID
      const newNick = `${nomeAtual} | ${userId}`;

      try {
        await guildMember.setNickname(newNick);
      } catch (err) {
        console.log("❌ Erro ao alterar apelido:", err.message);
      }

      return interaction.reply({
        content:
          `✅ **APROVADO COM SUCESSO**\n\n` +
          `👤 Membro: <@${userId}>\n` +
          `✏️ Novo apelido: **${newNick}**`
      });
    }
  }

  // =========================
  // 📩 PRONTUÁRIO
  // =========================
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const cargo = interaction.fields.getTextInputValue("cargo");
    const crime = interaction.fields.getTextInputValue("crime");

    const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);
    const approvalChannel = await client.channels.fetch(APPROVAL_CHANNEL_ID);

    const prontuario = new EmbedBuilder()
      .setTitle("📁 PRONTUÁRIO DE SET")
      .setColor("#2b2d31")
      .addFields(
        { name: "👤 Nome", value: `**${nome}**`, inline: true },
        { name: "🆔 ID", value: `**${id}**`, inline: true },
        { name: "🎖️ Cargo", value: `**${cargo}**`, inline: true },
        { name: "📜 Descrição RP / Crime", value: `**${crime}**`, inline: false },
        { name: "📌 Jogador", value: `<@${interaction.user.id}>`, inline: false }
      );

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

    await requestChannel.send({
      content: "📁 Novo prontuário recebido",
      embeds: [prontuario]
    });

    await approvalChannel.send({
      content: "🚨 Pedido aguardando aprovação",
      embeds: [prontuario],
      components: [row]
    });

    return interaction.reply({
      content: "📨 Seu pedido foi enviado para análise!",
      ephemeral: true
    });
  }
});

// 🔑 LOGIN
client.login(TOKEN);
