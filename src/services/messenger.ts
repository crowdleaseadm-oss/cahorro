import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  circleId?: string;
  type: 'bid_superceded' | 'system' | 'award';
}

/**
 * Centrally manages notifications and simulated WhatsApp integration.
 */
export async function sendNotification(db: any, notification: NotificationData, userPhone?: string) {
  if (!db || !notification.userId) return;

  try {
    // 1. Persist notification in Firestore
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });

    // 2. Simulated WhatsApp Notification
    if (userPhone && notification.type === 'bid_superceded') {
      const waMessage = `¡Hola! Te avisamos desde la plataforma que tu oferta en el círculo ${notification.circleId || ''} ha sido superada por un nuevo líder. Podés volver a licitar para recuperar tu lugar.`;
      
      console.log(`[WHATSAPP SIMULATION] Para: ${userPhone}`);
      console.log(`Mensaje: ${waMessage}`);
      
      // In a real environment with an API Key, we would call the provider here:
      // await axios.post('https://api.wa-provider.com/send', { phone: userPhone, body: waMessage });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
