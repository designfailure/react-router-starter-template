import { z } from "zod";
import { getLlmClient, getLlmModel, isLlmEnabled } from "./client";

const imageAnalysisSchema = z
  .object({
    visual_description: z.string().min(1),
    visual_match_signal: z.number().min(-1).max(1),
  })
  .strict();

export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>;

export async function analyzeImage(
  imageBase64: string,
  imageMime: string,
): Promise<ImageAnalysis | null> {
  if (!isLlmEnabled()) {
    return null;
  }

  const client = getLlmClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: getLlmModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Vrni izključno JSON z visual_description in visual_match_signal (-1 do 1). Opiši vizual v slovenščini in oceni ujemanje z pet-health / insurance kampanjo.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analiziraj priloženo sliko za oglase.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageMime};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as unknown;
    const validated = imageAnalysisSchema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}
