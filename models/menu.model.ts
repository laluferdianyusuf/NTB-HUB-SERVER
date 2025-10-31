export interface Menu {
  id?: string;
  venueId: string;
  name: string;
  price: number;
  category: string;
  isAvailable?: boolean;
  createdAt?: Date;
}
