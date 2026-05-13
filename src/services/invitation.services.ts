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
      `
        <p>Halo,</p>
        <p>Anda diundang untuk mendaftarkan venue.</p>

        <p>Kode undangan: <b>${key}</b></p>
      `,
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
      "Undangan Event – NTB Hub Apps",
      `
    <p>Anda diundang untuk bergabung ke event.</p>
    <p>Kode: <b>${key}</b></p>
    `,
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
      "Undangan Bergabung ke Komunitas – NTB Hub Apps",
      `
        <p>Halo,</p>
        <p>Anda diundang untuk menjadi pemilik komunitas.</p>

        <p>Kode undangan: <b>${key}</b></p>
      `,
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
