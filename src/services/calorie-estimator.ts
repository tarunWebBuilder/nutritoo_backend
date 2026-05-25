export interface CalorieEstimate {
  description: string;
  calories: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  serving_size?: string;
}

export async function estimateCalories(
  foodDescription: string,
  apiKey: string
): Promise<CalorieEstimate | null> {
  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content:
              "You are a nutrition expert. Given a food description, estimate its calorie content and macronutrients. " +
              'Respond with valid JSON only in this exact format: ' +
              '{ "description": "normalized food name", "calories": 123, "protein_g": 10, "fat_g": 5, "carbs_g": 20, "serving_size": "1 cup (200g)" }. ' +
              "Be realistic and specific. If you cannot estimate, respond with { \"error\": \"reason\" }.",
          },
          { role: "user", content: foodDescription },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (parsed.error || !parsed.calories || parsed.calories <= 0) return null;

    return {
      description: parsed.description || foodDescription,
      calories: Math.round(parsed.calories),
      protein_g: parsed.protein_g ? Math.round(parsed.protein_g) : undefined,
      fat_g: parsed.fat_g ? Math.round(parsed.fat_g) : undefined,
      carbs_g: parsed.carbs_g ? Math.round(parsed.carbs_g) : undefined,
      serving_size: parsed.serving_size,
    };
  } catch {
    return null;
  }
}
