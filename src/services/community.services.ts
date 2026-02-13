import { Community, Prisma } from "@prisma/client";
import { CommunityRepository, CommunityMemberRepository } from "repositories";
import { uploadImage } from "utils/uploadS3";

interface CommunityWithMembership {
  community: Community;
  membership: {
    userId: string;
    role: string;
    status: string;
  };
}

export class CommunityService {
  private communityRepo = new CommunityRepository();
  private memberRepo = new CommunityMemberRepository();

  async createCommunity(
    payload: Prisma.CommunityCreateInput,
    file?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (file) {
      const image = await uploadImage({ file, folder: "communities" });
      imageUrl = image.url;
    }

    if (!payload.name || !payload.description) {
      throw new Error("Required fields are missing");
    }

    return this.communityRepo.createCommunity({
      ...payload,
      image: imageUrl,
    });
  }

  async findAll(
    userId: string,
    params: { page?: number; limit?: number },
    search?: string,
  ) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    console.log(search);

    const communities = await this.communityRepo.findAllCommunity({
      skip,
      take: limit,
      search,
    });

    const joined: CommunityWithMembership[] = [];
    const notJoined: Community[] = [];

    communities.forEach((community) => {
      const membership = community.members.find((m) => m.userId === userId);

      if (membership) {
        joined.push({ community, membership });
      } else {
        notJoined.push(community);
      }
    });

    return { joined, notJoined };
  }

  async findById(id: string) {
    const community = await this.communityRepo.findById(id);
    if (!community) throw new Error("COMMUNITY_NOT_FOUND");
    return community;
  }

  async update(id: string, data: { name?: string; description?: string }) {
    const community = await this.communityRepo.updateCommunity(id, data);
    if (!community) throw new Error("COMMUNITY_NOT_FOUND");
    return community;
  }

  async delete(id: string) {
    return this.communityRepo.deleteCommunity(id);
  }

  async getMembers(
    communityId: string,
    params: { page?: number; limit?: number },
    search?: string,
  ) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    return this.memberRepo.findByCommunity(
      communityId,
      { skip, take: limit },
      search,
    );
  }
}
