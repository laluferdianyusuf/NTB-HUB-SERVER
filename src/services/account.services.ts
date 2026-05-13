import { Prisma } from "@prisma/client";
import { AccountRepository } from "repositories";

const accountRepo = new AccountRepository();

interface CreateAccountPayload {
  type: AccountType;
  userId?: string;
  venueId?: string;
  eventId?: string;
  communityEventId?: string;
  courierId?: string;
  id?: string;
}

type AccountType =
  | "USER"
  | "VENUE"
  | "EVENT"
  | "COMMUNITY"
  | "COURIER"
  | "PLATFORM";

export class AccountService {
  async ensureAccount(
    payload: CreateAccountPayload,
    tx?: Prisma.TransactionClient,
  ) {
    switch (payload.type) {
      case "USER":
        return accountRepo.upsertByUser(payload.userId as string, tx);

      case "VENUE":
        return accountRepo.upsertByVenue(payload.venueId as string, tx);

      case "EVENT":
        return accountRepo.upsertByEvent(payload.eventId as string, tx);

      case "COMMUNITY":
        return accountRepo.upsertByCommunity(
          payload.communityEventId as string,
          tx,
        );

      case "COURIER":
        return accountRepo.upsertByCourier(payload.courierId as string, tx);

      case "PLATFORM":
        return accountRepo.findPlatformAccount();

      default:
        throw new Error("Invalid Account Type");
    }
  }

  async getAccountByType(
    type: AccountType,
    id: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (!id) throw new Error(`${type} ID is required`);

    let account;

    switch (type) {
      case "USER":
        account = await accountRepo.findUserAccount(id, tx);
        break;
      case "VENUE":
        account = await accountRepo.findVenueAccount(id, tx);
        break;
      case "EVENT":
        account = await accountRepo.findEventAccount(id);
        break;
      case "COMMUNITY":
        account = await accountRepo.findCommunityEventAccount(id);
        break;
      case "COURIER":
        account = await accountRepo.findCourierAccount(id);
        break;
    }

    if (!account) {
      throw new Error(`${type} account not found`);
    }

    return account;
  }
}
