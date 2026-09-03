import prisma from '../config/db';

export interface PushNotificationPayload {
  toToken: string;
  title: string;
  body: string;
  data?: any;
}

export async function sendExpoPushNotification(payload: PushNotificationPayload) {
  if (!payload.toToken || !payload.toToken.startsWith('ExponentPushToken')) {
    return false;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.toToken,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      }),
    });

    const resData = await response.json();
    return resData;
  } catch (err) {
    console.error('⚠️ Error sending Expo Push Notification:', err);
    return false;
  }
}

export async function notifyUser(userId: string, title: string, body: string, data?: any) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { pushToken: true },
    });

    if (profile && profile.pushToken) {
      await sendExpoPushNotification({
        toToken: profile.pushToken,
        title,
        body,
        data,
      });
    }
  } catch (err) {
    console.error('⚠️ Error notifying user via push:', err);
  }
}
