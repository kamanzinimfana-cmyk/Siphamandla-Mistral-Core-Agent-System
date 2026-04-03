import { Mistral } from "@mistralai/mistralai";
import { cleanDOM } from "../utils/domCleaner";

export async function runRedAgent({
  task,
  pageSnapshot,
  memory,
  blueContext,
  config
}: any) {
  const client = new Mistral({
    apiKey: config.apiKey
  });
  const cleanedDOM = cleanDOM(pageSnapshot.domTree);

  const payload = {
    task,
    url: pageSnapshot.url,
    dom: cleanedDOM,
    forms: pageSnapshot.forms,
    interactiveElements: pageSnapshot.interactiveElements,
    memory,
    blueReasoning: blueContext?.reasoning || null
  };

  const response = await client.agents.complete({
    agentId: config.redAgentId,
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
    throw new Error("Red Agent returned invalid JSON");
  }

  // ✅ Validate actions
  output.actions = (output.actions || []).filter((a: any) =>
    ["click","fill","select","hover","type","submit","upload","wait","scroll"].includes(a.type)
  );

  return output;
}
