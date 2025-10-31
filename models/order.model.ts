export interface Order {
  id?: string;
  bookingId: string;
  menuId: string;
  quantity: number;
  subtotal: number;
}
