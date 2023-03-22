import { Client, REST, Routes, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { chat, image } from "./ai";
//config dotenv
dotenv.config();
//init discord bot
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

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
  { name: "chat", description: "talk to ai", options: [{ name: "prompt", description: "prompt", type: 3 }] },
  { name: "image", description: "generate an image", options: [{ name: "prompt", description: "prompt", type: 3 }] },
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
  if (interaction.commandName === "chat") {
    try {
      await interaction.deferReply();
      let reply = await chat(interaction);
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
  if (interaction.commandName === "image") {
    try {
      const prompt = interaction.options.getString("prompt");
      if (prompt === "" || prompt === null || prompt === undefined) {
        interaction.reply("Please enter a prompt");
        return;
      }
      await interaction.deferReply();
      let reply = await image(prompt);
      await interaction.editReply(`> ${prompt} \n ${reply}`);
    } catch (error) {
      console.error(error);
      await interaction.editReply("Failed to generate image");
    }
  }
});

client.login(TOKEN);
