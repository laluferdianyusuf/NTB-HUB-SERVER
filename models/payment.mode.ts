import { PaymentStatus } from "./enum";

export interface Payment {
  id?: string;
  bookingId: string;
  provider: string;
  transactionId?: string;
  amount: number;
  status?: PaymentStatus;
  paymentUrl?: string;
  paidAt?: Date;
  createdAt?: Date;
}
