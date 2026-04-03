import { Mistral } from "@mistralai/mistralai";
import { cleanDOM } from "../utils/domCleaner";

export async function runBlueAgent({
  task,
  pageSnapshot,
  memory,
  config
}: any) {
  const client = new Mistral({
    apiKey: config.apiKey
  });
  const cleanedDOM = cleanDOM(pageSnapshot.domTree);

  const payload = {
    task,
    url: pageSnapshot.url,
    title: pageSnapshot.title,
    dom: cleanedDOM,
    forms: pageSnapshot.forms,
    interactiveElements: pageSnapshot.interactiveElements.length,
    memory
  };

  const response = await client.agents.complete({
    agentId: config.blueAgentId,
    messages: [
      {
        role: "user",
        content: JSON.stringify(payload)
      }
    ]
  });

  const text = (response.choices?.[0]?.message?.content as string) || "{}";

  let output;
  try {
    output = JSON.parse(text);
  } catch {
    throw new Error("Blue Agent returned invalid JSON");
  }

  // 🔥 Confidence enforcement
  if (output.confidence < 70) {
    output.status = "need_red";
  }

  return output;
}
