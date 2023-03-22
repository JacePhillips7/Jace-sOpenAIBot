import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";
import { CacheType, Interaction } from "discord.js";
//config dotenv
dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));
var chat = async function (interaction: any): Promise<string> {
  const prompt = interaction.options.getString("prompt");
  if (prompt === "" || prompt === null || prompt === undefined) {
    return "Please enter a prompt";
  }

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
  //pricing is $0.002 / 1K tokens
  // log the cost in dollars
  let tokens = response.data.usage?.total_tokens;
  if (tokens) {
    console.log("cost", (tokens / 1000) * 0.002);
    console.log("tokens", tokens);
  }

  let text = response.data.choices[0];
  let reply = `> ${prompt} \n ${text.message?.content}`;
  return reply ?? "No reply";
};
var image = async function (prompt: string): Promise<string> {
  const response = await openai.createImage({
    prompt: prompt,
    response_format: "url",
  });
  return response.data.data[0].url ?? "No reply";
};
export { chat, image };
