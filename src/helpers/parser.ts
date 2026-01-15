export const toBool = (v: any) =>
  v === true || v === "true" || v === 1 || v === "1";

export const toNum = (v: any) =>
  v === "" || v === null || v === undefined ? null : Number(v);

export const jsonToObject = (value: unknown): Record<string, any> => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return {};
};
