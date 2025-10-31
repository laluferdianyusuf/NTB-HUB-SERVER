import { Role } from "./enum";

export interface User {
  id?: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
  createdAt?: Date;
  updatedAt?: Date;
}
