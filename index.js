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

    if (interaction.commandName === "limpar") {

      const quantidade = interaction.options.getInteger("quantidade");

      if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          flags: 64
        });
      }

      await interaction.channel.bulkDelete(quantidade, true);

      return interaction.reply({
        content: `🧹 ${quantidade} mensagens apagadas!`,
        flags: 64
      });
    }
  }

  // =========================
  // 📋 ABRIR FORM
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
  // 📩 FORM SUBMIT + DM OBRIGATÓRIO
  // =========================
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const experiencia = interaction.fields.getTextInputValue("experiencia");

    const channel = await interaction.guild.channels.fetch(APPROVAL_CHANNEL_ID).catch(() => null);

    if (!channel) {
      return interaction.reply({
        content: "❌ Canal de análise não encontrado.",
        flags: 64
      });
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

    // =========================
    // 💌 DM OBRIGATÓRIO
    // =========================
    const invite = "https://discord.gg/y6tJAK3fF5";

    try {
      await interaction.user.send(
`🏥 **HOSPITAL BELLA - INSTRUÇÃO OBRIGATÓRIA**

📌 Para continuar sua análise, você precisa entrar no servidor:

🔗 ${invite}

⚠️ Sem isso sua candidatura pode ser recusada automaticamente.

👨‍⚕️ Aguarde retorno da equipe médica.`
      );
    } catch (err) {
      console.log("❌ DM bloqueada:", interaction.user.tag);
    }

    return interaction.reply({
      content: "📨 Enviado para análise! Verifique seu privado 📩",
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

    const executor = await interaction.guild.members.fetch(interaction.user.id);

    if (!executor.roles.cache.has(LEADER_ROLE_ID)) {
      return interaction.editReply("❌ Sem permissão.");
    }

    const [action, userId] = interaction.customId.split("_");
    const member = await interaction.guild.members.fetch(userId);

    const embed = interaction.message.embeds[0];
    const nome = embed.fields[0].value;
    const id = embed.fields[1].value;

    await interaction.message.delete().catch(() => {});

    // ❌ RECUSAR
    if (action === "recusar") {
      return interaction.editReply(`❌ RECUSADO\n\n👤 ${nome}\n🆔 ${id}`);
    }

    // ✅ APROVAR
    if (action === "aprovar") {

      await member.roles.add([
        ROLE_PARAMEDICO_ID,
        ROLE_MEMBRO_HP_ID
      ]);

      let nick = `[PARM] ${nome} | ${id}`;
      if (nick.length > 32) nick = nick.slice(0, 32);

      await member.setNickname(nick).catch(() => {});

      // 📁 PRONTUÁRIO BONITO
      const requestChannel = await interaction.guild.channels.fetch(REQUEST_CHANNEL_ID).catch(() => null);

      if (requestChannel) {

        const prontuarioEmbed = new EmbedBuilder()
          .setColor("#22c55e")
          .setTitle("📁 PRONTUÁRIO MÉDICO OFICIAL")
          .setDescription("Registro de contratação do Hospital Bella")
          .addFields(
            { name: "👤 Nome do Paciente", value: `\`${nome}\``, inline: true },
            { name: "🆔 ID do Paciente", value: `\`${id}\``, inline: true },
            { name: "🏷️ Nick no Servidor", value: `\`${nick}\``, inline: false },
            { name: "🩺 Cargo", value: "Paramédico", inline: true },
            { name: "👨‍⚕️ Responsável", value: `<@${interaction.user.id}>`, inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "Hospital Bella • Sistema Médico RP" })
          .setTimestamp();

        await requestChannel.send({ embeds: [prontuarioEmbed] });
      }

      // 💥 LOG
      const logChannel = await interaction.guild.channels.fetch(APPROVAL_CHANNEL_ID).catch(() => null);

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#00ff7f")
          .setTitle("🟢 NOVA CONTRATAÇÃO")
          .addFields(
            { name: "👤 Nome", value: nome },
            { name: "🆔 ID", value: id },
            { name: "🏷️ Nick", value: nick },
            { name: "🎖️ Cargo", value: "Paramédico" },
            { name: "👮 Aprovado por", value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

      return interaction.editReply(`✅ APROVADO\n\n👤 ${nome}\n🆔 ${id}\n🏷️ ${nick}`);
    }
  }
});

// 🔑 LOGIN
client.login(TOKEN);

// 💥 ANTI CRASH
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
