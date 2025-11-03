import { randomUUID } from "crypto";
import { InvitationKeyRepository, VenueRepository } from "repositories";
const invitationKeyRepository = new InvitationKeyRepository();
const venueRepository = new VenueRepository();

export class InvitationServices {
  async generateInvitationKey() {
    try {
      const key = `INVITE-${randomUUID()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const newVenue = await venueRepository.createVenue({} as any);
      const newKey = await invitationKeyRepository.generate(
        newVenue.id,
        expiresAt,
        key
      );
      return {
        status: true,
        status_code: 201,
        message: "Invitation key generated successfully",
        data: newKey,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message: "Internal server error" + error.message,
        data: null,
      };
    }
  }
}
