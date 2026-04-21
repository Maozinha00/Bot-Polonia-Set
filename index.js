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

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ /painelset registrado!");
  } catch (err) {
    console.error(err);
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
        .setColor("#0f172a")
        .setTitle("🇵🇱 POLÔNIA ROLEPLAY")
        .setDescription(
`━━━━━━━━━━━━━━━━━━━
🏴 **RECRUTAMENTO OFICIAL**

Entre para a família e construa seu legado no RP.

📌 Clique no botão abaixo para iniciar seu cadastro.
━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: "Sistema automático • Polônia RP" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_set")
          .setLabel("Entrar na Família")
          .setEmoji("📋")
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
      .setTitle("📋 Recrutamento Polônia");

    const nome = new TextInputBuilder()
      .setCustomId("nome")
      .setLabel("Seu nome no RP")
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
      .setColor("#f59e0b")
      .setTitle("🚨 NOVA SOLICITAÇÃO")
      .addFields(
        { name: "👤 Nome", value: `\`${nome}\``, inline: true },
        { name: "🆔 ID", value: `\`${id}\``, inline: true },
        { name: "📜 Histórico", value: crime },
        { name: "📌 Recruta", value: `<@${interaction.user.id}>` }
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

    await interaction.deferReply({ ephemeral: true });

    try {
      const executor = await interaction.guild.members.fetch(interaction.user.id);

      if (!executor.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.editReply("❌ Apenas líderes podem fazer isso.");
      }

      const [action, userId] = interaction.customId.split("_");
      const member = await interaction.guild.members.fetch(userId);

      const embedMsg = interaction.message.embeds[0];

      const nome = embedMsg.fields[0].value.replace(/`/g, "");
      const id = embedMsg.fields[1].value.replace(/`/g, "");

      // ❌ RECUSAR
      if (action === "recusar") {
        await member.send("❌ Você foi recusado.").catch(() => {});
        return interaction.editReply(`❌ Recusado: <@${userId}>`);
      }

      // ✅ APROVAR
      if (action === "aprovar") {

        await member.roles.add(ROLE_SET_ID).catch(() => {});

        // 🔥 NICK AUTOMÁTICO
        let nick = `${nome} | ${id}`;
        if (nick.length > 32) nick = nick.substring(0, 32);

        try {
          await member.setNickname(nick);
        } catch (err) {
          console.log("Erro ao mudar nick:", err.message);
        }

        await member.send(`✅ Aprovado!\nSeu nick: ${nick}`).catch(() => {});

        const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);

        await requestChannel.send(
`📁 **PRONTUÁRIO POLÔNIA**
━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nome}
🆔 ID: ${id}
🏷️ Nick: ${nick}
👮 Aprovado por: <@${interaction.user.id}>
━━━━━━━━━━━━━━━━━━━`
        );

        return interaction.editReply(
`✅ APROVADO

👤 ${nome}
🆔 ${id}
🏷️ ${nick}`
        );
      }

    } catch (err) {
      console.error(err);
      return interaction.editReply("❌ Erro na aprovação.");
    }
  }
});

// 🔑 LOGIN
client.login(TOKEN);

// 💥 ANTI-CRASH
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
