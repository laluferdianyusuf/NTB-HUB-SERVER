import { PrismaClient } from "@prisma/client";
import { publisher } from "config/redis.config";
import { fetchMetaData } from "helpers/meta";
import { CommunityPostRepository } from "repositories";
import { uploadImage } from "utils/uploadS3";

export class CommunityPostServices {
  private postRepo = new CommunityPostRepository();

  async getPosts(
    communityId: string,
    params: { page?: number; limit?: number },
    search?: string,
  ) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    return this.postRepo.findByCommunity(
      communityId,
      { skip, take: limit },
      search,
    );
  }

  async addPost(
    communityId: string,
    adminId: string,
    content: string,
    link?: string,
    file?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (file) {
      const image = await uploadImage({ file, folder: "community-posts" });
      imageUrl = image.url;
    }

    let title = "";
    let image: string | null = null;

    if (link) {
      try {
        const meta = await fetchMetaData(link);
        title = meta.title ?? "";
        image = String(meta.image) ?? null;
      } catch (err) {
        throw new Error("Fetch link failed");
      }
    } else {
      title = content;
      image = imageUrl;
    }

    const post = await this.postRepo.create({
      community: { connect: { id: communityId } },
      admin: { connect: { id: adminId } },
      content: title,
      image: image,
      link,
    });

    const eventPayload = {
      event: "community-post-added",
      payload: { post, communityId },
    };

    publisher.publish("community-events", JSON.stringify(eventPayload));

    return post;
  }

  async updatePost(postId: string, data: { content?: string; link?: string }) {
    return this.postRepo.update(postId, data);
  }

  async deletePost(postId: string) {
    return this.postRepo.delete(postId);
  }
}
