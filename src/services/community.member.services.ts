import { CommunityMemberRole } from "@prisma/client";
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

  async removeMember(memberId: string) {
    return this.memberRepo.remove(memberId);
  }
}
