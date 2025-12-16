import { randomUUID } from "crypto";
import { InvitationKeyRepository } from "repositories";
import { sendEmail } from "utils/mail";
const invitationKeyRepository = new InvitationKeyRepository();

export class InvitationServices {
  async generateInvitationKey(email: string, venueName: string) {
    try {
      const key = `INVITE-${randomUUID().slice(0, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const newKey = await invitationKeyRepository.generate(
        email,
        venueName,
        expiresAt,
        key
      );

      await sendEmail(
        email,
        "Undangan Pendaftaran Venue – NTB Hub Apps",
        `
        <p>Halo,</p>
        <p>Anda diundang untuk mendaftarkan venue <b>${venueName}</b>.</p>

        <a
          href="https://dev.ntbhubapps.com/venue-invite?key=${key}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#2563eb;
            color:#fff;
            border-radius:6px;
            text-decoration:none;
            font-weight:600;
          "
        >
          Buka Aplikasi
        </a>

        <p>Kode undangan: <b>${key}</b></p>
        <p>Kode berlaku hingga ${expiresAt.toLocaleString("id-ID")}.</p>
      `
      );

      return {
        status: true,
        status_code: 201,
        message: "Invitation key generated successfully",
        data: {
          id: newKey.invitation.id,
          email: email,
          venueName: newKey.venue.name,
          expiresAt: newKey.invitation.expiresAt,
        },
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message:
          "Internal server error: " +
          (error instanceof Error ? error.message : String(error)),
        data: null,
      };
    }
  }

  async findAllInvitationKeys() {
    try {
      const invitationKeys = await invitationKeyRepository.findAll();
      if (!invitationKeys || invitationKeys.length === 0) {
        return {
          status: false,
          status_code: 404,
          message: "No invitation keys found",
          data: null,
        };
      }
      return {
        status: true,
        status_code: 200,
        message: "Invitation keys retrieved successfully",
        data: invitationKeys,
      };
    } catch (error) {
      return {
        status: false,
        status_code: 500,
        message:
          "Internal server error: " +
          (error instanceof Error ? error.message : String(error)),
        data: null,
      };
    }
  }

  async findInvitationKey(key: string) {
    try {
      const invitationKey = await invitationKeyRepository.findByKey(key);
      if (!invitationKey) {
        return {
          status: false,
          status_code: 404,
          message: "Invitation key not found",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Invitation key found",
        data: invitationKey,
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

  async findInvitationKeysByVenueId(venueId: string) {
    try {
      const invitationKeys = await invitationKeyRepository.findByVenueId(
        venueId
      );

      if (!invitationKeys) {
        return {
          status: false,
          status_code: 404,
          message: "No invitation keys found for this venue",
          data: null,
        };
      }

      return {
        status: true,
        status_code: 200,
        message: "Invitation keys retrieved successfully",
        data: invitationKeys,
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
