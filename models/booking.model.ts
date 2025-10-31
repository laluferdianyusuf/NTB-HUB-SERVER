import { BookingStatus } from "./enum";

export interface Booking {
  id?: string;
  userId: string;
  venueId: string;
  tableId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status?: BookingStatus;
  paymentId?: string;
  createdAt?: Date;
}
