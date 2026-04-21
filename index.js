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
const REQUEST_CHANNEL_ID = "1495178025602515177"; // 📁 PRONTUÁRIOS
const APPROVAL_CHANNEL_ID = "1495790507182522450"; // 📊 ANÁLISE

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
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

  // ===== COMANDO =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setColor("#0f172a")
        .setTitle("🇵🇱 POLÔNIA ROLEPLAY")
        .setDescription(
`━━━━━━━━━━━━━━━━━━━
🏴 RECRUTAMENTO OFICIAL

Clique abaixo para entrar na família
━━━━━━━━━━━━━━━━━━━`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_set")
          .setLabel("Entrar")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // ===== FORM =====
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Recrutamento");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("nome")
          .setLabel("Nome RP")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("ID")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("crime")
          .setLabel("Histórico")
          .setStyle(TextInputStyle.Paragraph)
      )
    );

    return interaction.showModal(modal);
  }

  // ===== ENVIO PARA APROVAÇÃO =====
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const crime = interaction.fields.getTextInputValue("crime");

    const channel = await client.channels.fetch(APPROVAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setColor("#ffaa00")
      .setTitle("🚨 NOVO RECRUTAMENTO")
      .addFields(
        { name: "👤 Nome", value: nome },
        { name: "🆔 ID", value: id },
        { name: "📜 Histórico", value: crime },
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

    return interaction.reply({ content: "Pedido enviado!", ephemeral: true });
  }

  // ===== APROVAÇÃO =====
  if (interaction.isButton()) {

    if (!interaction.customId.startsWith("aprovar_") && !interaction.customId.startsWith("recusar_")) return;

    await interaction.deferReply({ ephemeral: true });

    const executor = await interaction.guild.members.fetch(interaction.user.id);

    if (!executor.roles.cache.has(LEADER_ROLE_ID)) {
      return interaction.editReply("❌ Sem permissão.");
    }

    const [action, userId] = interaction.customId.split("_");
    const member = await interaction.guild.members.fetch(userId);

    const embed = interaction.message.embeds[0];
    const nome = embed.fields[0].value;
    const id = embed.fields[1].value;

    // ❌ RECUSAR
    if (action === "recusar") {
      await member.send("❌ Você foi recusado.").catch(() => {});
      return interaction.editReply("Recusado.");
    }

    // ✅ APROVAR
    if (action === "aprovar") {

      await member.roles.add(ROLE_SET_ID).catch(() => {});

      let nick = `${nome} | ${id}`;
      if (nick.length > 32) nick = nick.slice(0, 32);

      try {
        await member.setNickname(nick);
      } catch {}

      // 📁 PRONTUÁRIO
      const prontuarioChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);

      await prontuarioChannel.send(
`📁 **PRONTUÁRIO POLÔNIA**
━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nome}
🆔 ID: ${id}
🏷️ Nick: ${nick}
👮 Aprovado por: <@${interaction.user.id}>
━━━━━━━━━━━━━━━━━━━`
      );

      await member.send(`✅ Aprovado!\nSeu nick: ${nick}`).catch(() => {});

      return interaction.editReply("✅ Aprovado com sucesso!");
    }
  }
});

// 🔑 LOGIN
client.login(TOKEN);

// 💥 ANTI-CRASH
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
