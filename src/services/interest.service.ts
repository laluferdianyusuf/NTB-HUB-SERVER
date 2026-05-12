import { InterestRepository } from "repositories";

export class InterestService {
  private interestRepository: InterestRepository;

  constructor() {
    this.interestRepository = new InterestRepository();
  }

  async getAllInterests() {
    return this.interestRepository.getAllInterests();
  }

  async getMyInterests(userId: string) {
    return this.interestRepository.getUserInterests(userId);
  }

  async updateUserInterests(userId: string, interestIds: string[]) {
    if (interestIds.length === 0) {
      throw new Error("Please select at least one interest");
    }

    if (interestIds.length > 5) {
      throw new Error("Maximum 5 interests");
    }

    const validInterests =
      await this.interestRepository.validateInterestIds(interestIds);

    if (validInterests.length !== interestIds.length) {
      throw new Error("Some interests are invalid");
    }

    await this.interestRepository.removeAllUserInterests(userId);

    await this.interestRepository.addUserInterests(userId, interestIds);

    return this.interestRepository.getUserInterests(userId);
  }
}
