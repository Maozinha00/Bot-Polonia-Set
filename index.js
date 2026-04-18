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

// 📌 CANAIS FIXOS
const REQUEST_CHANNEL_ID = "1495017395062964304";
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

// 🚀 REGISTRO COMANDO
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
        "📌 Informe Nome RP, ID, Cargo e descrição RP\n" +
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
  // 🧾 BOTÕES
  // =========================
  if (interaction.isButton()) {

    // 🔵 ABRIR FORM
    if (interaction.customId === "abrir_set") {

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
      interaction.customId.startsWith("aprovar_") ||
      interaction.customId.startsWith("recusar_")
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

      if (action === "aprovar") {

        await guildMember.roles.add(ROLE_SET_ID);

        return interaction.reply({
          content: `✅ Pedido aprovado! Cargo **${cargo}** entregue para <@${userId}>`
        });
      }

      if (action === "recusar") {

        return interaction.reply({
          content: `❌ Pedido recusado para <@${userId}>`
        });
      }
    }
  }

  // =========================
  // 📩 FORM SUBMIT (PRONTUÁRIO)
  // =========================
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const cargo = interaction.fields.getTextInputValue("cargo");
    const crime = interaction.fields.getTextInputValue("crime");

    const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);
    const approvalChannel = await client.channels.fetch(APPROVAL_CHANNEL_ID);

    // 📁 PRONTUÁRIO
    const prontuario = new EmbedBuilder()
      .setTitle("📁 PRONTUÁRIO DE SOLICITAÇÃO")
      .setColor("#2b2d31")
      .addFields(
        { name: "👤 Nome", value: `**${nome}**`, inline: true },
        { name: "🆔 ID", value: `**${id}**`, inline: true },
        { name: "🎖️ Cargo", value: `**${cargo}**`, inline: true },
        { name: "📜 Descrição RP / Crime", value: `**${crime}**`, inline: false },
        { name: "📌 Jogador", value: `<@${interaction.user.id}>`, inline: false }
      )
      .setFooter({ text: `Prontuário ID: ${id}` });

    // 🔘 BOTÕES
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

    // 📥 histórico
    await requestChannel.send({
      content: `📁 Novo prontuário recebido`,
      embeds: [prontuario]
    });

    // 📤 aprovação
    await approvalChannel.send({
      content: `🚨 Pedido aguardando aprovação`,
      embeds: [prontuario],
      components: [row]
    });

    return interaction.reply({
      content: "📨 Seu prontuário foi enviado para análise!",
      ephemeral: true
    });
  }
});

// 🔑 LOGIN
client.login(TOKEN);
