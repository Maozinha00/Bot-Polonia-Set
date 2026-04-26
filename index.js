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

// 🎖️ CARGOS
const ROLE_PARAMEDICO_ID = "1477683902079303934";
const ROLE_MEMBRO_HP_ID = "1477683902079303932";

// 📌 CANAIS
const REQUEST_CHANNEL_ID = "1495178025602515177";
const APPROVAL_CHANNEL_ID = "1497304750214090846";
const DISMISS_LOG_CHANNEL_ID = "1477683907754197099";

// 🚫 BLOQUEADOS
const BLOCKED_CHANNELS = [
  "1477683904025591980",
  "1497304750214090846"
];

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 📌 COMANDOS
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel de recrutamento do Hospital Bella")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("paineldemissao")
    .setDescription("Abrir painel de demissão")
    .toJSON()
];

// 🚀 REGISTRO
const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("clientReady", async () => {
  console.log(`🤖 Online: ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
  } catch (err) {
    console.error(err);
  }
});

// 🚫 BLOQUEIO
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (BLOCKED_CHANNELS.includes(message.channel.id)) {
    await message.delete().catch(() => {});
  }
});

// 📌 INTERAÇÕES
client.on("interactionCreate", async (interaction) => {

  // =========================
  // COMANDOS
  // =========================
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setColor("#22c55e")
        .setTitle("🏥 HOSPITAL BELLA")
        .setDescription(
`━━━━━━━━━━━━━━━━━━━
👨‍⚕️ **RECRUTAMENTO OFICIAL**

Faça parte da equipe médica do hospital.

📋 Clique no botão abaixo para se cadastrar.
━━━━━━━━━━━━━━━━━━━`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_set")
          .setLabel("📋 Fazer Cadastro")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.commandName === "paineldemissao") {

      const embed = new EmbedBuilder()
        .setColor("#ef4444")
        .setTitle("📋 PAINEL DE DEMISSÃO")
        .setDescription(
`━━━━━━━━━━━━━━━━━━━
❌ **DEMISSÃO DE MEMBRO**

Clique abaixo para demitir.
━━━━━━━━━━━━━━━━━━━`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_demissao")
          .setLabel("📋 Demitir Membro")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // =========================
  // FORM SET (ORIGINAL)
  // =========================
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Cadastro Hospital Bella");

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
          .setLabel("ID do Jogador")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("experiencia")
          .setLabel("Experiência médica")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  // =========================
  // FORM DEMISSÃO
  // =========================
  if (interaction.isButton() && interaction.customId === "abrir_demissao") {

    const modal = new ModalBuilder()
      .setCustomId("form_demissao")
      .setTitle("Demissão");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("ID do membro")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("motivo")
          .setLabel("Motivo")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  // =========================
  // ENVIO SET (ORIGINAL)
  // =========================
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const experiencia = interaction.fields.getTextInputValue("experiencia");

    const channel = await interaction.guild.channels.fetch(APPROVAL_CHANNEL_ID).catch(() => null);

    if (!channel) {
      return interaction.reply({ content: "❌ Canal não encontrado.", flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("📋 NOVO CADASTRO")
      .addFields(
        { name: "👤 Nome", value: nome },
        { name: "🆔 ID", value: id },
        { name: "🩺 Experiência", value: experiencia },
        { name: "📌 Discord", value: `<@${interaction.user.id}>` }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`aprovar_${interaction.user.id}`).setLabel("Aprovar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`recusar_${interaction.user.id}`).setLabel("Recusar").setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: "📨 Enviado para análise!", flags: 64 });
  }

  // =========================
  // DEMISSÃO FINAL
  // =========================
  if (interaction.isModalSubmit() && interaction.customId === "form_demissao") {

    await interaction.deferReply({ flags: 64 });

    if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
      return interaction.editReply("❌ Sem permissão.");
    }

    const userId = interaction.fields.getTextInputValue("id");
    const motivo = interaction.fields.getTextInputValue("motivo");

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return interaction.editReply("❌ Membro não encontrado.");

    // remove cargos
    await member.roles.remove([ROLE_PARAMEDICO_ID, ROLE_MEMBRO_HP_ID]).catch(() => {});

    // limpa nick
    let nickAtual = member.nickname || member.user.username;
    let nickLimpo = nickAtual.replace(/\[.*?\]\s*/g, "").split("|")[0].trim();

    await member.setNickname(nickLimpo).catch(() => {});

    // log
    const logChannel = await interaction.guild.channels.fetch(DISMISS_LOG_CHANNEL_ID).catch(() => null);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setColor("#7f1d1d")
        .setTitle("📋 DEMISSÃO")
        .setDescription(
"```yaml\n" +
`Membro: ${member.user.username}
ID: ${member.id}
Motivo: ${motivo}
Responsável: ${interaction.user.username}` +
"\n```"
        )
        .addFields(
          { name: "👤 Usuário", value: `<@${member.id}>` },
          { name: "📌 Status", value: `Demitido por <@${interaction.user.id}> ❌` }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    return interaction.editReply("✅ Demitido com sucesso!");
  }
});

client.login(TOKEN);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
