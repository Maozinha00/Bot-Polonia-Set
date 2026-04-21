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
const REQUEST_CHANNEL_ID = "1495178025602515177"; // prontuário
const APPROVAL_CHANNEL_ID = "1495790507182522450"; // aprovação

// 🤖 BOT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 📌 COMANDO
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel Polônia RP")
    .toJSON()
];

// 🚀 REGISTRO
const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`🤖 Online: ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
});

// =========================
// 📌 INTERAÇÕES
// =========================
client.on("interactionCreate", async (interaction) => {

  // 🟣 PAINEL
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setTitle("🇵🇱 FAMÍLIA POLÔNIA")
        .setDescription("🇵🇱 Lealdade, respeito e poder — a Família Polônia domina o submundo.")
        .setColor("#000000");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_set")
          .setLabel("Entrar na Família")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // 🧾 FORMULÁRIO
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

  // 📩 ENVIO PARA APROVAÇÃO
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

  // 🟢 APROVAR / ❌ RECUSAR
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

    const embed = interaction.message.embeds[0];

    const nomeRP = embed.fields.find(f => f.name === "👤 Nome").value.replace(/\*\*/g, "");
    const idRP = embed.fields.find(f => f.name === "🆔 ID").value.replace(/\*\*/g, "");
    const crime = embed.fields.find(f => f.name === "📜 Histórico").value.replace(/\*\*/g, "");

    // ❌ RECUSAR
    if (action === "recusar") {
      return interaction.reply({
        content: `❌ Pedido recusado para <@${userId}>`
      });
    }

    // ✅ APROVAR
    if (action === "aprovar") {

      await guildMember.roles.add(ROLE_SET_ID);

      const newNick = `${nomeRP} | ${idRP}`;

      try {
        await guildMember.setNickname(newNick);
      } catch {}

      const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);

      // 📁 PRONTUÁRIO ESTILO FOTO
      const prontuarioMsg =
`📁 **NOVO PRONTUÁRIO RECEBIDO**

━━━━━━━━━━━━━━
🆔 **ID:** ${idRP}
👤 **Nome:** ${nomeRP}
🏢 **Unidade:** Polônia
🎖️ **Cargo:** Membro
👮 **Responsável:** <@${interaction.user.id}>
━━━━━━━━━━━━━━`;

      await requestChannel.send({
        content: prontuarioMsg
      });

      return interaction.reply({
        content:
          `✅ APROVADO\n\n` +
          `👤 ${nomeRP}\n` +
          `🆔 ${idRP}\n` +
          `✏️ ${newNick}`
      });
    }
  }

});

// 🔑 LOGIN
client.login(TOKEN);
