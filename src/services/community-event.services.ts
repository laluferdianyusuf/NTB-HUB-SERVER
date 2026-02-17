import { CommunityEventType } from "@prisma/client";
import { prisma } from "config/prisma";
import {
  CommunityEventCollaborationRepository,
  CommunityEventRepository,
} from "repositories";
import { uploadImage } from "utils/uploadS3";

export class CommunityEventService {
  private repo = new CommunityEventRepository();
  private collabRepo = new CommunityEventCollaborationRepository();

  listByCommunity(communityId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.repo.findByCommunity(communityId, { skip, take: limit });
  }

  async createEvent(
    communityId: string,
    createdById: string,
    data: {
      title: string;
      description?: string;
      startAt: Date;
      endAt?: Date;
      type?: CommunityEventType;
      location?: string;
      meetingLink?: string;
      collaborations?: string[];
    },
    file: Express.Multer.File,
  ) {
    console.log("communityId:", communityId);
    return prisma.$transaction(async (tx) => {
      let imageUrl: string | null = null;

      if (file) {
        const image = await uploadImage({ file, folder: "community-events" });
        imageUrl = image.url;
      }

      const event = await this.repo.create(
        {
          title: data.title,
          description: data.description,
          startAt: data.startAt,
          endAt: data.endAt,
          type: data.type,
          location: data.location,
          image: imageUrl,
          community: { connect: { id: communityId } },
          createdBy: { connect: { id: createdById } },
        },
        tx,
      );

      if (data.collaborations?.length) {
        await this.collabRepo.bulkAdd(event.id, data.collaborations, tx);
      }

      return event;
    });
  }

  async addCollaboration(eventId: string, communityId: string) {
    return this.collabRepo.add(eventId, communityId);
  }

  updateEvent(id: string, data: any) {
    return this.repo.update(id, data);
  }

  getEventDetail(id: string) {
    const event = this.repo.findById(id);

    return event;
  }

  deleteEvent(id: string) {
    return this.repo.delete(id);
  }
}
