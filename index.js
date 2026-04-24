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

/* ================= CONFIG ================= */

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LEADER_ROLE_ID = process.env.LEADER_ROLE_ID;
const ROLE_SET_ID = process.env.ROLE_SET_ID;

// 🎖️ Cargo extra
const EXTRA_ROLE_ID = "1495178024759332915";

// 📌 Canais
const REQUEST_CHANNEL_ID = "1495178025602515177"; // prontuário
const APPROVAL_CHANNEL_ID = "1495790507182522450"; // análise

/* ================= BOT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* ================= COMANDOS ================= */

const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel Polônia RP")
    .toJSON()
];

/* ================= REGISTRO ================= */

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`🤖 Online: ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ Comandos registrados!");
  } catch (err) {
    console.error(err);
  }
});

/* ================= INTERAÇÕES ================= */

client.on("interactionCreate", async (interaction) => {

  /* ===== COMANDO ===== */
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setColor("#0f172a")
        .setTitle("🇵🇱 POLÔNIA ROLEPLAY")
        .setDescription(`
━━━━━━━━━━━━━━━━━━━
🏴 **RECRUTAMENTO OFICIAL**

Entre para a família e construa seu legado no RP.

📌 Clique no botão abaixo para iniciar seu cadastro.
━━━━━━━━━━━━━━━━━━━
        `)
        .setFooter({ text: "Sistema automático • Polônia RP" });

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

  /* ===== ABRIR FORM ===== */
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Recrutamento Polônia");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("nome")
          .setLabel("Nome RP")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("ID no servidor")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("crime")
          .setLabel("Histórico RP")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  /* ===== ENVIO PARA ANÁLISE ===== */
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

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: "📨 Pedido enviado para análise!",
      ephemeral: true
    });
  }

  /* ===== APROVAR / RECUSAR ===== */
  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("aprovar_") ||
      interaction.customId.startsWith("recusar_"))
  ) {

    await interaction.deferReply({ ephemeral: true });

    try {
      const executor = await interaction.guild.members.fetch(interaction.user.id);

      if (!executor.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.editReply("❌ Você não tem permissão.");
      }

      const [action, userId] = interaction.customId.split("_");
      const member = await interaction.guild.members.fetch(userId);

      const embed = interaction.message.embeds[0];
      const nome = embed.fields[0].value;
      const id = embed.fields[1].value;

      // 🧹 apaga painel
      await interaction.message.delete().catch(() => {});

      /* ===== RECUSAR ===== */
      if (action === "recusar") {
        return interaction.editReply(`❌ REPROVADO\n👤 ${nome}\n🆔 ${id}`);
      }

      /* ===== APROVAR ===== */
      if (action === "aprovar") {

        await member.roles.add([ROLE_SET_ID, EXTRA_ROLE_ID]).catch(() => {});

        let nick = `${nome} | ${id}`;
        if (nick.length > 32) nick = nick.slice(0, 32);

        await member.setNickname(nick).catch(() => {});

        // 📁 prontuário
        const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);

        await requestChannel.send(`
📁 **PRONTUÁRIO POLÔNIA**
━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nome}
🆔 ID: ${id}
🏷️ Nick: ${nick}
🎖️ Cargos aplicados
👮 Aprovado por: <@${interaction.user.id}>
━━━━━━━━━━━━━━━━━━━
        `);

        return interaction.editReply(`✅ APROVADO\n👤 ${nome}\n🆔 ${id}\n🏷️ ${nick}`);
      }

    } catch (err) {
      console.error(err);
      return interaction.editReply("❌ Erro ao processar.");
    }
  }
});

/* ================= LOGIN ================= */

client.login(TOKEN);

/* ================= ANTI-CRASH ================= */

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
