export const getColombiaTimestamp = (): string => {
  const now = new Date()
  const s = now.toLocaleString("sv-SE", { timeZone: "America/Bogota", hour12: false }).replace(" ", "T")
  return `${s}.${String(now.getMilliseconds()).padStart(3, "0")}`
}
