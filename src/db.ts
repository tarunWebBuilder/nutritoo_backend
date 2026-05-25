import type { DbUser } from "./types";

export async function findOrCreateUser(
  db: D1Database,
  telegramId: number,
  firstName?: string,
  lastName?: string,
  username?: string
): Promise<DbUser> {
  const existing = await db
    .prepare("SELECT * FROM users WHERE telegram_id = ?")
    .bind(telegramId)
    .first<DbUser>();

  if (existing) {
    await db
      .prepare(
        "UPDATE users SET first_name = ?, last_name = ?, username = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind(firstName || null, lastName || null, username || null, existing.id)
      .run();
    return existing;
  }

  const result = await db
    .prepare(
      "INSERT INTO users (telegram_id, first_name, last_name, username) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .bind(telegramId, firstName || null, lastName || null, username || null)
    .first<DbUser>();

  return result!;
}

export async function updateSubscription(
  db: D1Database,
  userId: number,
  subscribedUntil: string | null
): Promise<void> {
  await db
    .prepare("UPDATE users SET subscribed_until = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(subscribedUntil, userId)
    .run();
}

export async function insertFoodEntry(
  db: D1Database,
  userId: number,
  description: string,
  calories: number,
  aiResponse: object | null
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO food_entries (user_id, description, calories, ai_response) VALUES (?, ?, ?, ?)"
    )
    .bind(userId, description, calories, aiResponse ? JSON.stringify(aiResponse) : null)
    .run();
}

export async function getTodayEntries(
  db: D1Database,
  userId: number
): Promise<{ description: string; calories: number; logged_at: string }[]> {
  const result = await db
    .prepare(
      "SELECT description, calories, logged_at FROM food_entries WHERE user_id = ? AND date(date) = date('now') ORDER BY logged_at DESC"
    )
    .bind(userId)
    .all<{ description: string; calories: number; logged_at: string }>();
  return result.results || [];
}

export async function getTodayTotal(
  db: D1Database,
  userId: number
): Promise<number> {
  const result = await db
    .prepare(
      "SELECT COALESCE(SUM(calories), 0) as total FROM food_entries WHERE user_id = ? AND date(date) = date('now')"
    )
    .bind(userId)
    .first<{ total: number }>();
  return result?.total || 0;
}

export async function getWeekEntries(
  db: D1Database,
  userId: number
): Promise<{ date: string; calories: number }[]> {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  const mondayStr = monday.toISOString().split("T")[0];

  const result = await db
    .prepare(
      "SELECT date(date) as date, SUM(calories) as calories FROM food_entries WHERE user_id = ? AND date >= ? GROUP BY date(date) ORDER BY date(date)"
    )
    .bind(userId, mondayStr)
    .all<{ date: string; calories: number }>();
  return result.results || [];
}
