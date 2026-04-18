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
const APPROVAL_CHANNEL_ID = process.env.APPROVAL_CHANNEL_ID;

// 🤖 BOT (CORRIGIDO - sem intents problemáticos)
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 📌 COMANDO
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel premium de solicitação de set")
    .toJSON()
];

// 🚀 REGISTRO DE COMANDO
const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
}

// 🎯 BOT ONLINE
client.once("ready", () => {
  console.log(`🤖 Online como ${client.user.tag}`);
  registerCommands();
});

// 📌 INTERAÇÕES
client.on("interactionCreate", async (interaction) => {

  // =========================
  // 🟣 COMANDO /painelset
  // =========================
  if (interaction.isChatInputCommand() && interaction.commandName === "painelset") {

    const embed = new EmbedBuilder()
      .setTitle("🇵🇱 PAINEL DE SET - POLÔNIA RP")
      .setDescription(
        "```📌 Sistema oficial de solicitação de set```\n\n" +
        "• Clique no botão abaixo para solicitar seu set\n" +
        "• Informe Nome RP, ID e Cargo\n" +
        "• Aguarde aprovação da liderança\n\n" +
        "⚠️ Pedidos falsos serão recusados."
      )
      .setColor("#ff0000")
      .setFooter({ text: "Polônia RP • Sistema de Organização" });

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

    // 🔵 ABRIR FORMULÁRIO
    if (interaction.customId === "abrir_set") {

      const modal = new ModalBuilder()
        .setCustomId("form_set")
        .setTitle("Solicitação de Set - Polônia");

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

      modal.addComponents(
        new ActionRowBuilder().addComponents(nome),
        new ActionRowBuilder().addComponents(id),
        new ActionRowBuilder().addComponents(cargo)
      );

      return interaction.showModal(modal);
    }

    // =========================
    // 🟢 APROVAR / ❌ RECUSAR
    // =========================

    if (interaction.customId.startsWith("aprovar_") || interaction.customId.startsWith("recusar_")) {

      // 👮 validação de líder
      const member = interaction.member;

      if (!member.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Apenas líderes podem aprovar pedidos.",
          ephemeral: true
        });
      }

      const data = interaction.customId.split("_");
      const action = data[0];
      const userId = data[1];
      const cargo = data[2];

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
  // 📩 MODAL SUBMIT
  // =========================
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const cargo = interaction.fields.getTextInputValue("cargo");

    const channel = await client.channels.fetch(APPROVAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("📥 NOVA SOLICITAÇÃO DE SET")
      .setColor("#ffaa00")
      .addFields(
        { name: "👤 Nome RP", value: nome, inline: true },
        { name: "🆔 ID", value: id, inline: true },
        { name: "🎖️ Cargo", value: cargo, inline: true },
        { name: "📌 Usuário", value: `<@${interaction.user.id}>` }
      )
      .setFooter({ text: "Aguardando análise da liderança" });

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

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "📨 Seu pedido foi enviado para análise da liderança!",
      ephemeral: true
    });
  }
});

// 🔑 LOGIN
client.login(TOKEN);
