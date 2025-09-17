// Lightweight data generators; no external deps required

export function randInt(min = 0, max = 1_000_000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randString(prefix = "str", len = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${Date.now().toString(36)}-${s}`;
}

export function randEmail(prefix = "user"): string {
  return `${randString(prefix, 6)}@example.com`;
}

export function strongPassword(): string {
  return `Str0ng!-${randString("pw", 10)}`;
}
