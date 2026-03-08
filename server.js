import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const client = new Anthropic();

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/research", async (req, res) => {
  const { company } = req.body;
  if (!company?.trim()) {
    return res.status(400).json({ error: "Company name is required." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `You are a professional business analyst. When given a company name, produce a detailed, well-structured company research report in Markdown format.

The report must contain the following sections (use ## for section headings):

## Company Overview
Brief description, founding date, headquarters, industry, and business model.

## Products & Services
Key products or services offered.

## Leadership
Current CEO and key executives (if known).

## Financial Snapshot
Revenue, profitability, market cap or valuation, and recent financial highlights (if publicly available).

## Market Position & Competition
Industry standing, key competitors, and competitive advantages.

## Recent News & Developments
Notable news, acquisitions, partnerships, or strategic moves from the past year or two.

## Key Facts
5–8 bullet points of the most important facts about the company.

Be factual and concise. If certain information is not publicly known or verifiable, say so rather than speculating.`;

  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Please produce a company research report for: ${company}`,
        },
      ],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Company Research tool running at http://localhost:${PORT}`);
});
