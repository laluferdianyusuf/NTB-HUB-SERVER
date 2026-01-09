export const toBool = (v: any) =>
  v === true || v === "true" || v === 1 || v === "1";

export const toNum = (v: any) =>
  v === "" || v === null || v === undefined ? null : Number(v);
