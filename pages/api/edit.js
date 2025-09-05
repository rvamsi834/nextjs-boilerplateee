import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { text } = req.body;
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful writing assistant. Improve the text." },
        { role: "user", content: text },
      ],
    });
    const edited = completion.choices[0].message.content;
    res.status(200).json({ edited });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
