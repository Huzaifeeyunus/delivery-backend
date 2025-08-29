



export function generateSKU(name: string) {
  const cleanedName = name
    .toString()
    .trim()
    .replace(/\s+/g, "")           // remove spaces
    .replace(/[^a-zA-Z0-9_-]/g, "") // remove special characters
    .toUpperCase();

  const randomNumbers = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${cleanedName}_${randomNumbers}`;
}