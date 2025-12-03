import { DeviceRepository, UserRepository } from "repositories";

export class DeviceService {
  private deviceRepo = new DeviceRepository();
  private userRepo = new UserRepository();

  async registerDevice(data: {
    userId: string;
    token: string;
    platform?: string;
    osName?: string;
    osVersion?: string;
    deviceModel?: string;
  }) {
    const user = await this.userRepo.findById(data.userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
        data: null,
      };
    }

    const device = await this.deviceRepo.registerDevice(data as any);

    return {
      status: true,
      message: "Device registered successfully",
      data: device,
    };
  }

  async getUserDevices(userId: string) {
    const devices = await this.deviceRepo.findByUserId(userId);
    return {
      status: true,
      message: "Device is founded",
      data: devices,
    };
  }

  async unregisterDevice(token: string) {
    try {
      await this.deviceRepo.deleteByToken(token);
      return { status: true, message: "Device removed", data: null };
    } catch (error) {
      return { status: false, message: "Device not found", data: null };
    }
  }
}
