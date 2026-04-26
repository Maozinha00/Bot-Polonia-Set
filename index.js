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

// 🚫 CANAIS BLOQUEADOS
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
    .setDescription("Abrir painel de recrutamento")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("limpar")
    .setDescription("Apagar mensagens")
    .addIntegerOption(option =>
      option.setName("quantidade")
        .setDescription("1-100")
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("clientReady", async () => {
  console.log(`🤖 Online: ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
});

// =========================
// 🚫 BLOQUEIO
// =========================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (BLOCKED_CHANNELS.includes(message.channel.id)) {
    await message.delete().catch(() => {});
  }
});

// =========================
// 📌 INTERAÇÕES
// =========================
client.on("interactionCreate", async (interaction) => {

  // 📌 COMANDOS
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setColor("#22c55e")
        .setTitle("🏥 HOSPITAL BELLA")
        .setDescription("Clique abaixo para se cadastrar");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_set")
          .setLabel("📋 Fazer Cadastro")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.commandName === "limpar") {

      if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.reply({ content: "❌ Sem permissão.", flags: 64 });
      }

      const quantidade = interaction.options.getInteger("quantidade");
      await interaction.channel.bulkDelete(quantidade, true);

      return interaction.reply({ content: "🧹 Limpo!", flags: 64 });
    }
  }

  // 📋 FORM
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Cadastro");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("nome")
          .setLabel("Nome")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("ID")
          .setStyle(TextInputStyle.Short)
      )
    );

    return interaction.showModal(modal);
  }

  // 📩 ENVIO
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");

    const channel = await interaction.guild.channels.fetch(APPROVAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("📋 NOVO CADASTRO")
      .addFields(
        { name: "Nome", value: nome },
        { name: "ID", value: id }
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
      content: "📨 Enviado!",
      flags: 64
    });
  }

  // =========================
  // ✅ APROVAR / ❌ RECUSAR
  // =========================
  if (interaction.isButton()) {

    const executor = await interaction.guild.members.fetch(interaction.user.id);

    if (!executor.roles.cache.has(LEADER_ROLE_ID)) {
      return interaction.reply({ content: "❌ Sem permissão.", flags: 64 });
    }

    const [action, userId] = interaction.customId.split("_");
    const member = await interaction.guild.members.fetch(userId);

    const embed = interaction.message.embeds[0];
    const nome = embed.fields[0].value;
    const id = embed.fields[1].value;

    await interaction.message.delete().catch(() => {});

    if (action === "recusar") {
      return interaction.reply({ content: "❌ Recusado", flags: 64 });
    }

    // ✅ APROVAR
    await member.roles.add([
      ROLE_PARAMEDICO_ID,
      ROLE_MEMBRO_HP_ID
    ]);

    let nick = `[HP] ${nome} | ${id}`;
    if (nick.length > 32) nick = nick.slice(0, 32);
    await member.setNickname(nick).catch(() => {});

    const requestChannel = await interaction.guild.channels.fetch(REQUEST_CHANNEL_ID);

    // 💎 NOVO MODELO IGUAL IMAGEM
    const prontuarioEmbed = new EmbedBuilder()
      .setColor("#5a1a0e")
      .setTitle("📋 PEDIDO DE SET")
      .setDescription(
        "```" +
`Nome: ${nome}
ID: ${id}
Unidade: hp
Cargo: Diretor
Responsável: ${interaction.user.username}` +
        "```"
      )
      .addFields(
        {
          name: "👤 Usuário",
          value: `<@${member.id}>`
        },
        {
          name: "📌 Status",
          value: `Aprovado por <@${interaction.user.id}> ✅`
        }
      )
      .setTimestamp();

    await requestChannel.send({ embeds: [prontuarioEmbed] });

    return interaction.reply({
      content: "✅ Aprovado!",
      flags: 64
    });
  }
});

// 🔑 LOGIN
client.login(TOKEN);
