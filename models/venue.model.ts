import { VenueType } from "./enum";

export interface Venue {
  id?: string;
  name: string;
  type: VenueType;
  address: string;
  latitude?: number;
  longitude?: number;
  createdAt?: Date;
}
