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
    .setDescription("Abrir painel da Família Polônia RP")
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

  // 🟣 PAINEL DA FACÇÃO
  if (interaction.isChatInputCommand() && interaction.commandName === "painelset") {

    const embed = new EmbedBuilder()
      .setTitle("🇵🇱 FAMÍLIA POLÔNIA RP")
      .setDescription(
`No submundo ninguém sobrevive sozinho. Aqui, lealdade vale mais que sangue.

A Família Polônia não é apenas uma facção — é uma organização silenciosa que controla ruas, negócios e informações sem chamar atenção.

Respeito se conquista. Traição se paga.
Cada membro tem seu papel, cada decisão tem consequência.

Aqui não existe segunda chance para erros.
Ou você faz parte da família… ou vira história.

━━━━━━━━━━━━━━
⚖️ REGRAS:
• Lealdade acima de tudo  
• Sigilo total das operações  
• Respeito à hierarquia  
• Nenhuma ação sem ordem superior  

💀 “Quem entra, não sai igual. Quem trai, não sai vivo.”
━━━━━━━━━━━━━━

Clique abaixo para entrar na família.`
      )
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
      .setTitle("Recrutamento Família Polônia");

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
      .setLabel("Função desejada na família")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const crime = new TextInputBuilder()
      .setCustomId("crime")
      .setLabel("Histórico / Descrição RP")
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
        content: "❌ Apenas líderes podem aprovar recrutamentos.",
        ephemeral: true
      });
    }

    const [action, userId, cargo] = interaction.customId.split("_");

    const guildMember = await interaction.guild.members.fetch(userId);

    // ❌ RECUSAR
    if (action === "recusar") {
      return interaction.reply({
        content: `❌ Recrutamento recusado para <@${userId}>`
      });
    }

    // ✅ APROVAR
    if (action === "aprovar") {

      await guildMember.roles.add(ROLE_SET_ID);

      const currentName = guildMember.displayName || "Membro";
      const newNick = `${currentName} | ${userId} | ${cargo}`;

      try {
        await guildMember.setNickname(newNick);
      } catch (err) {
        console.log("❌ Erro ao renomear:", err.message);
      }

      return interaction.reply({
        content:
          `✅ **MEMBRO ACEITO NA FAMÍLIA POLÔNIA**\n\n` +
          `👤 Membro: <@${userId}>\n` +
          `🎖️ Função: **${cargo}**\n` +
          `✏️ Apelido atualizado: **${newNick}**`
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
      .setTitle("📁 PRONTUÁRIO - FAMÍLIA POLÔNIA")
      .setColor("#1a1a1a")
      .addFields(
        { name: "👤 Nome", value: `**${nome}**`, inline: true },
        { name: "🆔 ID", value: `**${id}**`, inline: true },
        { name: "🎖️ Função", value: `**${cargo}**`, inline: true },
        { name: "📜 Histórico RP", value: `**${crime}**`, inline: false },
        { name: "📌 Recruta", value: `<@${interaction.user.id}>`, inline: false }
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
      content: "📁 Novo recrutamento recebido",
      embeds: [prontuario]
    });

    await approvalChannel.send({
      content: "🚨 Recrutamento aguardando decisão da liderança",
      embeds: [prontuario],
      components: [row]
    });

    return interaction.reply({
      content: "📨 Seu recrutamento foi enviado para análise da família!",
      ephemeral: true
    });
  }
});

// 🔑 LOGIN
client.login(TOKEN);
