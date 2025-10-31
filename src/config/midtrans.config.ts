import midtransClient from "midtrans-client";

const isProduction = process.env.MIDTRANS_ENV === "production";

export const midtrans = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
});
