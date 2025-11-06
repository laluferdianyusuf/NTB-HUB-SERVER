import { OwnerServices } from "services";

export class OwnerControllers {
  private ownerServices: OwnerServices;

  constructor() {
    this.ownerServices = new OwnerServices();
  }

  async updateOwner() {}
}
