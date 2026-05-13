import { Role } from "@prisma/client";
import { prisma } from "config/prisma";
import { randomUUID } from "crypto";
import {
  CommunityMemberRepository,
  CommunityRepository,
  EventRepository,
  InvitationKeyRepository,
  UserRoleRepository,
  VenueRepository,
} from "repositories";
import { sendEmail } from "utils/mail";
import { AccountService } from "./account.services";

const invitationKeyRepository = new InvitationKeyRepository();
const userRoleRepository = new UserRoleRepository();
const communityRepository = new CommunityRepository();
const communityMemberRepository = new CommunityMemberRepository();
const accountService = new AccountService();
const eventService = new EventRepository();
const venueService = new VenueRepository();

const emailTemplate = ({
  title,
  message,
  code,
}: {
  title: string;
  message: string;
  code: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body
  style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,sans-serif;
  "
>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table
          width="100%"
          style="
            max-width:600px;
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,0.08);
          "
        >
          <!-- Header -->
          <tr>
            <td
              align="center"
              style="
                background:linear-gradient(135deg,#2563eb,#1d4ed8);
                padding:32px 24px;
                color:#ffffff;
              "
            >
              <h1 style="margin:0;font-size:28px;">
                NTB Hub Apps
              </h1>

              <p
                style="
                  margin-top:8px;
                  font-size:14px;
                  opacity:0.9;
                "
              >
                Invitation System
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;color:#1f2937;">
              <h2
                style="
                  margin-top:0;
                  font-size:24px;
                "
              >
                ${title}
              </h2>

              <p
                style="
                  font-size:16px;
                  line-height:1.8;
                  color:#4b5563;
                "
              >
                ${message}
              </p>

              <!-- Invitation Code -->
              <div
                style="
                  margin:32px 0;
                  background:#f9fafb;
                  border:1px dashed #cbd5e1;
                  border-radius:14px;
                  padding:24px;
                  text-align:center;
                "
              >
                <p
                  style="
                    margin:0 0 10px;
                    font-size:14px;
                    color:#64748b;
                  "
                >
                  Kode Undangan
                </p>

                <div
                  style="
                    font-size:30px;
                    font-weight:700;
                    letter-spacing:4px;
                    color:#0f172a;
                  "
                >
                  ${code}
                </div>
              </div>

              <p
                style="
                  margin-top:24px;
                  font-size:14px;
                  color:#6b7280;
                  line-height:1.7;
                "
              >
                Kode undangan ini hanya dapat digunakan satu kali
                dan berlaku selama <b>24 jam</b>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              style="
                background:#f9fafb;
                padding:20px 24px;
                text-align:center;
                font-size:12px;
                color:#9ca3af;
              "
            >
              © ${new Date().getFullYear()} NTB Hub Apps.
              All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export class InvitationServices {
  async generateInvitationKey(email: string, venueId: string) {
    const key = `VEN-${randomUUID().slice(0, 8).toUpperCase()}`;
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
      emailTemplate({
        title: "Undangan Venue",
        message: "Anda diundang untuk menjadi pemilik venue di NTB Hub Apps.",
        code: key,
      }),
    );

    return result;
  }

  async generateEventInvitationKey(email: string, eventId: string) {
    const key = `EVT-${randomUUID().slice(0, 8).toUpperCase()}`;
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
      "Undangan Pendaftaran Event – NTB Hub Apps",
      emailTemplate({
        title: "Undangan Event",
        message: "Anda diundang untuk menjadi pemilik event di NTB Hub Apps.",
        code: key,
      }),
    );

    return invitation;
  }

  async generateCommunityInvitation(email: string, communityId: string) {
    const key = `COMM-${randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    const invitation = await invitationKeyRepository.generateCommunity({
      email,
      key,
      role: Role.COMMUNITY_OWNER,
      communityId,
      expiresAt,
    });

    await sendEmail(
      email,
      "Undangan Pendaftaran Community – NTB Hub Apps",
      emailTemplate({
        title: "Undangan Community",
        message:
          "Anda diundang untuk menjadi pemilik community di NTB Hub Apps.",
        code: key,
      }),
    );

    return invitation;
  }

  async claimInvitation(key: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const invitation = await invitationKeyRepository.findByKey(key, tx);

      if (!invitation) throw new Error("Invalid invitation");
      if (invitation.usedAt) throw new Error("Invitation used");
      if (invitation.expiresAt && new Date() > invitation.expiresAt)
        throw new Error("Invitation expired");

      await userRoleRepository.assignVenueRole(
        {
          userId,
          venueId: invitation.venueId!,
          role: invitation.role,
        },
        tx,
      );

      await accountService.ensureAccount(
        {
          type: "VENUE",
          venueId: invitation.venueId!,
        },
        tx,
      );

      await invitationKeyRepository.markUsed(invitation.id, tx);

      await venueService.updateVenueOwner(
        invitation.venueId as string,
        {
          owner: { connect: { id: userId } },
        },
        tx,
      );

      return {
        venueId: invitation.venueId,
        role: invitation.role,
      };
    });
  }

  async claimEventInvitation(key: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const invitation = await invitationKeyRepository.findByKey(key, tx);

      if (!invitation) throw new Error("Invalid invitation");
      if (invitation.usedAt) throw new Error("Invitation used");
      if (invitation.expiresAt && new Date() > invitation.expiresAt)
        throw new Error("Invitation expired");

      if (!invitation.eventId) throw new Error("Invalid event invitation");

      await userRoleRepository.assignEventRole(
        {
          userId,
          eventId: invitation.eventId,
          role: invitation.role,
        },
        tx,
      );

      await accountService.ensureAccount(
        {
          type: "EVENT",
          eventId: invitation.eventId!,
        },
        tx,
      );

      await invitationKeyRepository.markUsed(invitation.id, tx);

      await eventService.updateEvent(
        invitation.eventId,
        {
          owner: { connect: { id: userId } },
        },
        tx,
      );

      return {
        eventId: invitation.eventId,
        role: invitation.role,
      };
    });
  }

  async claimCommunityInvitation(key: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const invitation = await invitationKeyRepository.findByKey(key, tx);

      if (!invitation) throw new Error("Invalid invitation");
      if (invitation.usedAt) throw new Error("Invitation used");
      if (invitation.expiresAt && new Date() > invitation.expiresAt)
        throw new Error("Invitation expired");
      if (!invitation.communityId)
        throw new Error("Invalid community invitation");

      await communityRepository.updateCommunity(
        invitation.communityId,
        {
          owner: { connect: { id: userId } },
        },
        tx,
      );

      await communityMemberRepository.addMember(
        {
          user: { connect: { id: userId } },
          community: { connect: { id: invitation.communityId } },
          role: "OWNER",
          status: "APPROVED",
        },
        tx,
      );

      await invitationKeyRepository.markUsed(invitation.id, tx);

      return {
        communityId: invitation.communityId,
        role: "OWNER",
      };
    });
  }
}
