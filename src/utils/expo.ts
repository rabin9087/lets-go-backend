import { Expo } from "expo-server-sdk";
const expo = new Expo();

export const sendPushNotification = async (
  token: string,
    newTrip: any,
    rider: string
) => {
  if (!Expo.isExpoPushToken(token)) return;

  await expo.sendPushNotificationsAsync([
    {
      to: token,
      sound: "default",
      title: "🚕 New Trip Request",
      body:
        `Pickup: ${newTrip.pickupLocation.address}\n` +
        `Dropoff: ${newTrip.dropoffLocation.address}\n` +
        `People: ${newTrip.people}`,
          data: {
            newTrip: newTrip,
            type: "TRIP_REQUEST",
            tripId: newTrip._id,
            rider,
            pickup: newTrip.pickupLocation,
            dropoff: newTrip.dropoffLocation,
            people: newTrip.people,
      },
    },
  ]);
};
