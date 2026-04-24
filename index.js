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
const REQUEST_CHANNEL_ID = "1477683904025591980"; // prontuário
const APPROVAL_CHANNEL_ID = "1497304750214090846"; // análise

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// 📌 COMANDOS
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel de recrutamento do Hospital Bella")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("limpar")
    .setDescription("Apagar mensagens do canal")
    .addIntegerOption(option =>
      option.setName("quantidade")
        .setDescription("Quantidade de mensagens (1-100)")
        .setRequired(true)
    )
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
    console.log("✅ Comandos registrados!");
  } catch (err) {
    console.error(err);
  }
});

// =========================
// 📌 INTERAÇÕES
// =========================
client.on("interactionCreate", async (interaction) => {

  // =========================
  // 📌 COMANDOS
  // =========================
  if (interaction.isChatInputCommand()) {

    // ===== PAINEL =====
    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setColor("#22c55e")
        .setTitle("🏥 HOSPITAL BELLA")
        .setDescription(
`━━━━━━━━━━━━━━━━━━━
👨‍⚕️ **RECRUTAMENTO OFICIAL - HP**

Faça parte da equipe médica e ajude a salvar vidas no RP.

📋 Clique no botão abaixo para realizar seu cadastro.
━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: "Sistema Hospitalar • Bella RP" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_set")
          .setLabel("📋 Fazer Cadastro")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    // ===== LIMPAR =====
    if (interaction.commandName === "limpar") {

      const quantidade = interaction.options.getInteger("quantidade");

      if (quantidade < 1 || quantidade > 100) {
        return interaction.reply({
          content: "❌ Escolha entre 1 e 100 mensagens.",
          flags: 64
        });
      }

      if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Você não tem permissão.",
          flags: 64
        });
      }

      try {
        await interaction.channel.bulkDelete(quantidade, true);

        return interaction.reply({
          content: `🧹 ${quantidade} mensagens apagadas!`,
          flags: 64
        });

      } catch (err) {
        return interaction.reply({
          content: "❌ Erro ao limpar mensagens.",
          flags: 64
        });
      }
    }
  }

  // =========================
  // 📋 ABRIR FORMULÁRIO
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
          .setLabel("Experiência na área médica")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  // =========================
  // 📩 ENVIO PARA ANÁLISE
  // =========================
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const experiencia = interaction.fields.getTextInputValue("experiencia");

    const channel = await client.channels.fetch(APPROVAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("📋 NOVO CADASTRO - HOSPITAL")
      .addFields(
        { name: "👤 Nome", value: nome },
        { name: "🆔 ID", value: id },
        { name: "🩺 Experiência", value: experiencia },
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

    return interaction.reply({
      content: "📨 Cadastro enviado para análise!",
      flags: 64
    });
  }

  // =========================
  // ✅ APROVAR / ❌ RECUSAR
  // =========================
  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("aprovar_") || interaction.customId.startsWith("recusar_"))
  ) {

    await interaction.deferReply({ flags: 64 });

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

      await interaction.message.delete().catch(() => {});

      // ❌ RECUSAR
      if (action === "recusar") {
        return interaction.editReply(
`❌ **CADASTRO REPROVADO**

👤 ${nome}
🆔 ${id}`
        );
      }

      // ✅ APROVAR
      if (action === "aprovar") {

        await member.roles.add([
          ROLE_PARAMEDICO_ID,
          ROLE_MEMBRO_HP_ID
        ]).catch(() => {});

        let nick = `${nome} | ${id}`;
        if (nick.length > 32) nick = nick.slice(0, 32);

        await member.setNickname(nick).catch(() => {});

        const requestChannel = await client.channels.fetch(REQUEST_CHANNEL_ID);

        await requestChannel.send(
`📁 **PRONTUÁRIO MÉDICO - HOSPITAL BELLA**
━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nome}
🆔 ID: ${id}
🏷️ Nick: ${nick}
🩺 Cargo: Paramédico
👨‍⚕️ Aprovado por: <@${interaction.user.id}>
━━━━━━━━━━━━━━━━━━━`
        );

        return interaction.editReply(
`✅ **APROVADO COM SUCESSO**

👤 ${nome}
🆔 ${id}
🏷️ ${nick}`
        );
      }

    } catch (err) {
      console.error(err);
      return interaction.editReply("❌ Erro ao processar.");
    }
  }
});

// 🔑 LOGIN
client.login(TOKEN);

// 💥 ANTI-CRASH
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
