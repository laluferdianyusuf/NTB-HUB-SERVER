import { Decimal } from "@prisma/client/runtime/library";

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

export const decimalToNumber = (
  value: Decimal | number | null | undefined,
): number => {
  if (value instanceof Decimal) {
    return value.toNumber();
  }

  return Number(value ?? 0);
};
