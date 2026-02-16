import {
  CommunityMemberRepository,
  EventOrderRepository,
  ProfileRepository,
  PublicPlaceImpressionRepository,
  UserRepository,
} from "repositories";

export class ProfileService {
  private repo = new ProfileRepository();
  private userRepo = new UserRepository();
  private comMemberRepo = new CommunityMemberRepository();
  private placeRepo = new PublicPlaceImpressionRepository();
  private eventRepo = new EventOrderRepository();

  async getProfile(profileId: string, viewerId?: string) {
    const [profile, communities, places, events] = await Promise.all([
      this.userRepo.findById(profileId),
      this.comMemberRepo.getUserCommunities(profileId),
      this.placeRepo.getVisitedPlaces(profileId),
      this.eventRepo.getUserEvents(profileId),
    ]);

    if (!profile) {
      throw new Error("Profile not found");
    }

    let isLiked = false;

    if (viewerId) {
      const liked = await this.repo.isLiked(profileId, viewerId);
      isLiked = !!liked;
    }

    return {
      user: {
        ...profile,
        isLiked,
      },
      communities: communities.map((c) => ({
        id: c.community.id,
        name: c.community.name,
        image: c.community.image,
        role: c.role,
        joinedAt: c.joinedAt,
      })),
      visitedPlaces: places.map((p) => ({
        id: p.place.id,
        name: p.place.name,
        type: p.place.type,
        image: p.place.image,
        visitedAt: p.createdAt,
      })),
      events: events.map((e) => ({
        id: e.event.id,
        name: e.event.name,
        image: e.event.image,
        startAt: e.event.startAt,
        joinedAt: e.createdAt,
      })),
    };
  }

  async viewProfile(profileId: string, viewerId?: string) {
    if (!viewerId || viewerId === profileId) return;

    const viewedToday = await this.repo.hasViewedToday(profileId, viewerId);
    if (viewedToday) return;

    await this.repo.createView(profileId, viewerId);
    await this.repo.incrementViewCounter(profileId);
  }

  async toggleLike(profileId: string, userId: string) {
    const liked = await this.repo.isLiked(profileId, userId);

    if (liked) {
      await this.repo.unlike(profileId, userId);
      return { liked: false };
    }

    await this.repo.like(profileId, userId);
    return { liked: true };
  }
}
