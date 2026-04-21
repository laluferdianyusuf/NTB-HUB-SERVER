import { Prisma } from "@prisma/client";
import { AccountRepository } from "repositories";

const accountRepo = new AccountRepository();

interface CreateAccountPayload {
  type: AccountType;
  userId?: string;
  venueId?: string;
  eventId?: string;
  communityId?: string;
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
        return accountRepo.upsertByCommunity(payload.communityId as string, tx);

      case "COURIER":
        return accountRepo.upsertByCourier(payload.courierId as string, tx);

      case "PLATFORM":
        return accountRepo.findPlatformAccount();

      default:
        throw new Error("INVALID_ACCOUNT_TYPE");
    }
  }
}
