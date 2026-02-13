import { CommunityReactionRepository } from "repositories";

export class CommunityReactionServices {
  private reactionRepo = new CommunityReactionRepository();

  async getReactions(postId: string) {
    return this.reactionRepo.findByPost(postId);
  }

  async addReaction(postId: string, userId: string, type: string) {
    return this.reactionRepo.create({ postId, userId, type });
  }

  async removeReaction(reactionId: string) {
    return this.reactionRepo.delete(reactionId);
  }
}
