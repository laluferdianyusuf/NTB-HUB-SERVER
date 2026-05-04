import firebase from "../utils/firebase";

export type NotificationJobData = {
  tokens: string[];
  payload: Omit<firebase.messaging.MulticastMessage, "tokens">;
};
