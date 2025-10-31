import { TableStatus } from "./enum";

export interface Table {
  id?: string;
  tableNumber: number;
  floorId?: string;
  venueId: string;
  status?: TableStatus;
  createdAt?: Date;
}
