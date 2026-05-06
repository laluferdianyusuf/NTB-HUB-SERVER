import jwt from "jsonwebtoken";

export const generateTicketQR = (payload: {
  orderId: string;
  userId: string;
  eventId: string;
}) => {
  return jwt.sign(
    {
      oid: payload.orderId,
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
