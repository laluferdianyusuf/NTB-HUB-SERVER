import { CommunityMemberRole, CommunityMemberStatus } from "@prisma/client";
import { prisma } from "config/prisma";
import { AppError } from "helpers/AppError";
import { CommunityMemberRepository } from "repositories";

export class CommunityMemberServices {
  private memberRepo = new CommunityMemberRepository();

  async addMemberByAdmin(
    communityId: string,
    userId: string,
    role: CommunityMemberRole = CommunityMemberRole.MEMBER,
  ) {
    const exists = await this.checkMember(communityId, userId);

    if (exists) {
      throw new Error("USER_ALREADY_JOINED");
    }

    return this.memberRepo.addMember({
      community: { connect: { id: communityId } },
      user: { connect: { id: userId } },
      role,
      status: "APPROVED",
      joinedAt: new Date(),
    });
  }

  async requestJoinCommunity(communityId: string, userId: string) {
    const exists = await this.checkMember(communityId, userId);

    if (exists) {
      throw new Error("USER_ALREADY_JOINED");
    }

    return this.memberRepo.addMember({
      community: { connect: { id: communityId } },
      user: { connect: { id: userId } },
      role: CommunityMemberRole.MEMBER,
      status: "PENDING",
    });
  }

  async checkMember(communityId: string, userId: string) {
    return this.memberRepo.findByCommunityAndUser(communityId, userId);
  }

  async approveMember(memberId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const member = await this.memberRepo.findById(memberId, tx);

      if (!member) {
        throw new AppError("Member not found", 404);
      }

      if (member.status === CommunityMemberStatus.APPROVED) {
        throw new AppError("Member already approved", 400);
      }

      if (member.status === CommunityMemberStatus.REJECTED) {
        throw new AppError("Cannot approve rejected member", 400);
      }

      const updated = await this.memberRepo.updateStatus(
        memberId,
        CommunityMemberStatus.APPROVED,
        tx,
      );

      return updated;
    });
  }

  async rejectMember(memberId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const member = await this.memberRepo.findById(memberId, tx);

      if (!member) {
        throw new AppError("Member not found", 404);
      }

      if (member.status === CommunityMemberStatus.APPROVED) {
        throw new AppError("Cannot reject approved member", 400);
      }

      const removed = await this.memberRepo.remove(memberId, tx);

      return removed;
    });
  }
}
