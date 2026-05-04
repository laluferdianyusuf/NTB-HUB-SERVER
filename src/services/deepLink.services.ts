import {
  CommunityRepository,
  EventRepository,
  PublicPlaceRepository,
  UserRepository,
  VenueRepository,
} from "repositories";

type DeepLinkData = {
  title: string;
  description: string;
  image: string;
};

export class DeepLinkDataService {
  constructor(
    private userRepository: UserRepository,
    private venueRepository: VenueRepository,
    private eventRepository: EventRepository,
    private communityRepository: CommunityRepository,
    private publicPlaceRepository: PublicPlaceRepository,
  ) {}

  async resolve(type: string, id: string): Promise<DeepLinkData | null> {
    switch (type) {
      case "user":
        return this.getUser(id);

      case "venue":
        return this.getVenue(id);

      case "event":
        return this.getEvent(id);

      case "community":
        return this.getCommunity(id);

      case "public-place":
        return this.getPublicPlace(id);

      default:
        return null;
    }
  }

  async getUser(id: string): Promise<DeepLinkData | null> {
    const user = await this.userRepository.findById(id);

    if (!user) return null;

    return {
      title: user.name,
      description: user.email,
      image:
        user.photo ||
        `https://ui-avatars.com/api/?name=${user.name}&background=0D9488&color=fff`,
    };
  }

  async getVenue(id: string): Promise<DeepLinkData | null> {
    const venue = await this.venueRepository.findVenueById(id);

    if (!venue) return null;

    return {
      title: venue.name,
      description: venue.address,
      image:
        venue.image ||
        `https://ui-avatars.com/api/?name=${venue.name}&background=0D9488&color=fff`,
    };
  }

  async getEvent(id: string): Promise<DeepLinkData | null> {
    const event = await this.eventRepository.findEventById(id);

    if (!event) return null;

    return {
      title: event.name,
      description: event.description,
      image:
        event.image ||
        `https://ui-avatars.com/api/?name=${event.name}&background=0D9488&color=fff`,
    };
  }

  async getCommunity(id: string): Promise<DeepLinkData | null> {
    const c = await this.communityRepository.findById(id);

    if (!c) return null;

    return {
      title: c.name,
      description: c.description as string,
      image:
        c.image ||
        `https://ui-avatars.com/api/?name=${c.name}&background=0D9488&color=fff`,
    };
  }

  async getPublicPlace(id: string): Promise<DeepLinkData | null> {
    const p = await this.publicPlaceRepository.findById(id);

    if (!p) return null;

    return {
      title: p.name,
      description: p.address,
      image:
        p.image ||
        `https://ui-avatars.com/api/?name=${p.name}&background=0D9488&color=fff`,
    };
  }
}
