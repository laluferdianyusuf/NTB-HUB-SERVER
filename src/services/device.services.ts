import { error, success } from "helpers/return";
import {
  DeviceRepository,
  UserRepository,
  VenueRepository,
} from "repositories";

export class DeviceService {
  private deviceRepo = new DeviceRepository();
  private userRepo = new UserRepository();
  private venueRepo = new VenueRepository();

  async registerDevice(data: {
    venueId?: string;
    userId?: string;
    token: string;
    platform?: string;
    osName?: string;
    osVersion?: string;
    deviceModel?: string;
  }) {
    console.log(data);

    try {
      if (data.userId) {
        const user = await this.userRepo.findById(data.userId);
        if (!user) {
          return error.error404("User not found");
        }

        const device = await this.deviceRepo.registerDevice({
          token: data.token,
          userId: data.userId,
          venueId: null,
          platform: data.platform,
          osName: data.osName,
          osVersion: data.osVersion,
          deviceModel: data.deviceModel,
        } as any);

        return success.success201("User device registered", device);
      }

      if (data.venueId) {
        const venue = await this.venueRepo.findVenueById(data.venueId);

        if (!venue) {
          return error.error404("Venue not found");
        }

        const device = await this.deviceRepo.create({
          token: data.token,
          userId: null,
          venueId: data.venueId,
          platform: data.platform,
          osName: data.osName,
          osVersion: data.osVersion,
          deviceModel: data.deviceModel,
        } as any);

        return success.success201("Venue device registered", device);
      }
    } catch (err) {
      return error.error500("Internal server error" + err);
    }
  }

  async getUserDevices(userId: string) {
    const devices = await this.deviceRepo.findByUserId(userId);
    return {
      status: true,
      message: "Device is founded",
      data: devices,
    };
  }
}
