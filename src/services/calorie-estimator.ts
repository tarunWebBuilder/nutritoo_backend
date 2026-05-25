export interface CalorieEstimate {
  description: string;
  calories: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  serving_size?: string;
}

const FALLBACK_DB: { keywords: string[]; estimate: CalorieEstimate }[] = [
  {
    keywords: ["roti", "chapati", "phulka"],
    estimate: { description: "Roti (whole wheat)", calories: 80, protein_g: 3, fat_g: 1, carbs_g: 15, serving_size: "1 roti (40g)" },
  },
  {
    keywords: ["rice", "chawal", "biryani", "pulao"],
    estimate: { description: "Rice (cooked)", calories: 200, protein_g: 4, fat_g: 1, carbs_g: 45, serving_size: "1 cup (200g)" },
  },
  {
    keywords: ["dal", "lentil", "soup"],
    estimate: { description: "Dal (cooked)", calories: 150, protein_g: 9, fat_g: 5, carbs_g: 20, serving_size: "1 cup (200g)" },
  },
  {
    keywords: ["paneer", "tofu", "cottage cheese"],
    estimate: { description: "Paneer", calories: 250, protein_g: 18, fat_g: 20, carbs_g: 2, serving_size: "100g" },
  },
  {
    keywords: ["chicken", "meat", "mutton", "beef", "pork", "fish"],
    estimate: { description: "Chicken (curry)", calories: 250, protein_g: 25, fat_g: 15, carbs_g: 5, serving_size: "1 cup (200g)" },
  },
  {
    keywords: ["egg", "anda", "omelette"],
    estimate: { description: "Egg (cooked)", calories: 150, protein_g: 12, fat_g: 10, carbs_g: 1, serving_size: "2 eggs" },
  },
  {
    keywords: ["bread", "toast"],
    estimate: { description: "Bread (toast)", calories: 80, protein_g: 3, fat_g: 1, carbs_g: 15, serving_size: "1 slice" },
  },
  {
    keywords: ["samosa"],
    estimate: { description: "Samosa (fried)", calories: 180, protein_g: 4, fat_g: 10, carbs_g: 20, serving_size: "1 piece" },
  },
  {
    keywords: ["dosa"],
    estimate: { description: "Dosa", calories: 130, protein_g: 3, fat_g: 5, carbs_g: 18, serving_size: "1 dosa" },
  },
  {
    keywords: ["idli"],
    estimate: { description: "Idli", calories: 70, protein_g: 2, fat_g: 0, carbs_g: 15, serving_size: "1 idli" },
  },
  {
    keywords: ["paratha"],
    estimate: { description: "Aloo Paratha", calories: 200, protein_g: 5, fat_g: 10, carbs_g: 25, serving_size: "1 paratha" },
  },
  {
    keywords: ["noodles", "chowmein", "pasta", "spaghetti", "macaroni"],
    estimate: { description: "Noodles (cooked)", calories: 220, protein_g: 6, fat_g: 5, carbs_g: 38, serving_size: "1 plate" },
  },
  {
    keywords: ["curry", "gravy", "subzi", "sabzi", "bhaji"],
    estimate: { description: "Mixed vegetable curry", calories: 150, protein_g: 4, fat_g: 8, carbs_g: 15, serving_size: "1 cup (200g)" },
  },
  {
    keywords: ["pizza"],
    estimate: { description: "Pizza slice", calories: 285, protein_g: 12, fat_g: 10, carbs_g: 36, serving_size: "1 slice" },
  },
  {
    keywords: ["burger"],
    estimate: { description: "Burger", calories: 500, protein_g: 25, fat_g: 25, carbs_g: 40, serving_size: "1 burger" },
  },
  {
    keywords: ["salad"],
    estimate: { description: "Green salad", calories: 100, protein_g: 3, fat_g: 5, carbs_g: 10, serving_size: "1 bowl" },
  },
  {
    keywords: ["fruit", "banana", "apple", "mango", "orange", "grapes"],
    estimate: { description: "Mixed fruit", calories: 120, protein_g: 1, fat_g: 0, carbs_g: 30, serving_size: "1 bowl" },
  },
  {
    keywords: ["yogurt", "curd", "dahi"],
    estimate: { description: "Yogurt", calories: 100, protein_g: 8, fat_g: 4, carbs_g: 8, serving_size: "1 cup (200g)" },
  },
  {
    keywords: ["chips", "fries", "french fries"],
    estimate: { description: "French fries", calories: 365, protein_g: 4, fat_g: 17, carbs_g: 48, serving_size: "1 medium serving" },
  },
  {
    keywords: ["sandwich"],
    estimate: { description: "Sandwich", calories: 350, protein_g: 15, fat_g: 12, carbs_g: 45, serving_size: "1 sandwich" },
  },
  {
    keywords: ["cake", "pastry", "dessert"],
    estimate: { description: "Cake slice", calories: 350, protein_g: 4, fat_g: 15, carbs_g: 50, serving_size: "1 slice" },
  },
  {
    keywords: ["ice cream", "kulfi"],
    estimate: { description: "Ice cream", calories: 270, protein_g: 4, fat_g: 14, carbs_g: 32, serving_size: "1 cup" },
  },
];

function findBestMatch(text: string): CalorieEstimate {
  const lower = text.toLowerCase();
  let matched: CalorieEstimate | null = null;

  for (const entry of FALLBACK_DB) {
    if (entry.keywords.some(k => lower.includes(k))) {
      matched = entry.estimate;
    }
  }

  if (matched) return matched;

  return { description: text, calories: 200, protein_g: 5, fat_g: 5, carbs_g: 30, serving_size: "1 serving" };
}

function parseQuantity(text: string): number {
  const match = text.match(/(\d+)\s*(plate|bowl|cup|piece|slice|rotis?|eggs?|parathas?|dosas?|idlis?|slices?|plates?|bowls?|cups?|pieces?|servings?|packets?|glasses?|bottles?)/i);
  if (match) {
    return Math.max(1, parseInt(match[1], 10));
  }
  const lower = text.toLowerCase();
  if (/\b(plate|bowl|cup)\b/.test(lower)) return 1;
  return 1;
}

function applyQuantity(base: CalorieEstimate, qty: number, text: string): CalorieEstimate {
  if (qty <= 1) return base;
  return {
    ...base,
    description: `${qty}x ${base.description}`,
    calories: base.calories * qty,
    protein_g: base.protein_g ? base.protein_g * qty : undefined,
    fat_g: base.fat_g ? base.fat_g * qty : undefined,
    carbs_g: base.carbs_g ? base.carbs_g * qty : undefined,
  };
}

export async function estimateCalories(
  foodDescription: string,
  apiKey: string
): Promise<CalorieEstimate> {
  const qty = parseQuantity(foodDescription);

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
              "You are a nutrition expert. Given ANY food description from any cuisine, estimate its calories and macros. " +
              'Reply with valid JSON only: { "description": "...", "calories": 123, "protein_g": 10, "fat_g": 5, "carbs_g": 20, "serving_size": "..." }. ' +
              "Always estimate — never refuse. For anything unfamiliar, guess based on similar foods.",
          },
          { role: "user", content: foodDescription },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.calories && parsed.calories > 0) {
          return applyQuantity({
            description: parsed.description || foodDescription,
            calories: Math.round(parsed.calories),
            protein_g: parsed.protein_g ? Math.round(parsed.protein_g) : undefined,
            fat_g: parsed.fat_g ? Math.round(parsed.fat_g) : undefined,
            carbs_g: parsed.carbs_g ? Math.round(parsed.carbs_g) : undefined,
            serving_size: parsed.serving_size,
          }, qty, foodDescription);
        }
      }
    }
  } catch {
    // fall through to fallback
  }

  const base = findBestMatch(foodDescription);
  return applyQuantity(base, qty, foodDescription);
}
