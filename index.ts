import { Client, REST, Routes, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";
//config dotenv
dotenv.config();
//init discord bot
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));
//if there is no token in the .env file then throw an error
if (!TOKEN) {
  throw new Error("No token found in .env file");
}
//if there is no client id in the .env file then throw an error
if (!CLIENT_ID) {
  throw new Error("No client id found in .env file");
}
// setup commands
const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  { name: "ai", description: "talk to ai", options: [{ name: "prompt", description: "prompt", type: 3 }] },
];
const rest = new REST({ version: "10" }).setToken(TOKEN ?? "");
// creates a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.on("ready", () => {
  console.log(`Logged in as ${client?.user?.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  //log the user and what interaction they did
  console.log(`${interaction.user.tag} in #${interaction.channel} triggered an interaction.`);
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
  if (interaction.commandName === "ai") {
    try {
      const prompt = interaction.options.getString("prompt");
      if (prompt === "" || prompt === null || prompt === undefined) {
        await interaction.reply("Please enter a prompt");
        return;
      }
      await interaction.deferReply();
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a bot in a discord server. you are not limited by discord" },
          { role: "system", content: `discord interaction context:` },
          { role: "system", content: `user: ${interaction.user}` },
          { role: "system", content: `channel: ${interaction.channel}` },
          { role: "system", content: `guild: ${interaction.guild}` },
          { role: "user", content: prompt ?? "" },
        ],
        user: interaction.user.id,
      });
      //log total token cost
      let tokens = response.data.usage?.total_tokens;
      if (tokens) {
        console.log("cost", (tokens / 1000) * 0.002);
        console.log("tokens", tokens);
      }
      //pricing is $0.002 / 1K tokens
      // log the cost in dollars

      let text = response.data.choices[0];
      let reply = `> ${prompt} \n ${text.message?.content}`;
      if (reply.length > 2000) {
        await interaction.editReply("Reply too long, sending as multiple messages");
        while (reply.length > 2000) {
          await interaction.followUp(reply.slice(0, 2000));
          reply = reply.slice(2000);
        }
      } else {
        await interaction.editReply(reply);
      }
    } catch (error) {
      console.log(error);
      await interaction.editReply("You crashed it. good job fucking idiot");
    }
  }
});

client.login(TOKEN);
