import { CommunityTwibbonRepository } from "repositories";
import { uploadImage } from "utils/uploadS3";

export class CommunityTwibbonService {
  private repo = new CommunityTwibbonRepository();

  getActiveTwibbons(communityId: string) {
    return this.repo.findActiveByCommunity(communityId);
  }

  async createTwibbon(
    communityId: string,
    createdById: string,
    data: {
      title: string;
      description?: string;
      startAt?: Date;
      endAt?: Date;
    },
    file: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (file) {
      const image = await uploadImage({ file, folder: "community-twibbon" });
      imageUrl = image.url;
    }

    return this.repo.create({
      ...data,
      frameImage: imageUrl as string,
      community: { connect: { id: communityId } },
      createdBy: { connect: { id: createdById } },
    });
  }

  updateTwibbon(id: string, data: any) {
    return this.repo.update(id, data);
  }

  deleteTwibbon(id: string) {
    return this.repo.delete(id);
  }
}
