import jwt from "jsonwebtoken";

export const generateTicketQR = (payload: {
  ticketId: string;
  userId: string;
  eventId: string;
}) => {
  return jwt.sign(
    {
      tid: payload.ticketId,
      uid: payload.userId,
      eid: payload.eventId,
    },
    process.env.QR_SECRET!,
    {
      expiresIn: "1d",
      issuer: "event-system",
    },
  );
};
