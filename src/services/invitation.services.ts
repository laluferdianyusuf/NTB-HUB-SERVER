import { PrismaClient, Role } from "@prisma/client";
import { prisma } from "config/prisma";
import { randomUUID } from "crypto";
import { InvitationKeyRepository, UserRoleRepository } from "repositories";
import { sendEmail } from "utils/mail";
const invitationKeyRepository = new InvitationKeyRepository();
const userRoleRepository = new UserRoleRepository();

export class InvitationServices {
  async generateInvitationKey(email: string, venueId: string) {
    const key = `INVITE-${randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await invitationKeyRepository.generateVenue({
      email,
      key,
      role: Role.VENUE_OWNER,
      venueId,
      expiresAt,
    });

    await sendEmail(
      email,
      "Undangan Pendaftaran Venue – NTB Hub Apps",
      `
        <p>Halo,</p>
        <p>Anda diundang untuk mendaftarkan venue.</p>

        <a
          href="com.laluferdian.ntbhubapps://venue?key=${key}"
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
      `,
    );

    return result;
  }

  async generateEventInvitationKey(email: string, eventId: string) {
    const key = `INVITE-${randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invitation = await invitationKeyRepository.generateEvent({
      email,
      key,
      role: Role.EVENT_OWNER,
      eventId,
      expiresAt,
    });

    await sendEmail(
      email,
      "Undangan Event – NTB Hub Apps",
      `
    <p>Anda diundang untuk bergabung ke event.</p>
    <p>Kode: <b>${key}</b></p>
    `,
    );

    return invitation;
  }

  async claimInvitation(key: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const invitation = await invitationKeyRepository.findByKey(key, tx);

      if (!invitation) throw new Error("INVALID_INVITATION");
      if (invitation.usedAt) throw new Error("INVITATION_USED");
      if (invitation.expiresAt && new Date() > invitation.expiresAt)
        throw new Error("INVITATION_EXPIRED");

      await userRoleRepository.assignVenueRole(
        {
          userId,
          venueId: invitation.venueId!,
          role: invitation.role,
        },
        tx,
      );

      await invitationKeyRepository.markUsed(invitation.id, tx);

      return {
        venueId: invitation.venueId,
        role: invitation.role,
      };
    });
  }

  async claimEventInvitation(key: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const invitation = await invitationKeyRepository.findByKey(key, tx);

      if (!invitation) throw new Error("INVALID_INVITATION");
      if (invitation.usedAt) throw new Error("INVITATION_USED");
      if (invitation.expiresAt && new Date() > invitation.expiresAt)
        throw new Error("INVITATION_EXPIRED");

      if (!invitation.eventId) throw new Error("INVALID_EVENT_INVITATION");

      await userRoleRepository.assignEventRole(
        {
          userId,
          eventId: invitation.eventId,
          role: invitation.role,
        },
        tx,
      );

      await invitationKeyRepository.markUsed(invitation.id, tx);

      return {
        eventId: invitation.eventId,
        role: invitation.role,
      };
    });
  }
}
