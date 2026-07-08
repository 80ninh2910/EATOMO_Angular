/**
 * FCM Utility — Firebase Cloud Messaging wrapper
 *
 * Setup:
 * 1. npm install firebase-admin
 * 2. Tạo Service Account trong Firebase Console → Project Settings → Service Accounts
 * 3. Download JSON key → đặt tên firebase-service-account.json (KHÔNG commit lên git)
 * 4. Thêm vào .env: FIREBASE_PROJECT_ID=your-project-id
 *
 * Hoặc dùng biến môi trường GOOGLE_APPLICATION_CREDENTIALS (đường dẫn tới JSON key)
 */

let admin = null;
let messaging = null;
let lastInitError = null;

function parseServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!serviceAccountJson && !serviceAccountBase64) {
    return null;
  }

  const raw = serviceAccountBase64
    ? Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
    : serviceAccountJson;
  const serviceAccount = JSON.parse(raw.trim());

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  return serviceAccount;
}

/**
 * Khởi tạo Firebase Admin SDK (lazy init — chỉ init khi cần)
 */
function initFirebase() {
  if (messaging) return messaging;

  try {
    lastInitError = null;
    admin = require('firebase-admin');

    if (!admin.apps.length) {
      // Option A: dùng service account JSON file
      const serviceAccount = parseServiceAccount();
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
        });
      } else if (serviceAccountPath) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
        });
      } else {
        // Option B: dùng Application Default Credentials (Render / Cloud environment)
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
    }

    messaging = admin.messaging();
    console.log('✅ Firebase Admin initialized');
    return messaging;
  } catch (err) {
    console.warn('⚠️  Firebase Admin not initialized:', err.message);
    console.warn('   Push notifications will be disabled. Install firebase-admin and configure credentials.');
    lastInitError = err.message;
    return null;
  }
}

function getFirebaseStatus() {
  const fcmMessaging = initFirebase();
  return {
    initialized: Boolean(fcmMessaging),
    projectId: process.env.FIREBASE_PROJECT_ID || null,
    hasServiceAccountJson: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    hasServiceAccountBase64: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64),
    hasServiceAccountPath: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
    hasGoogleApplicationCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    lastError: lastInitError
  };
}

/**
 * Gửi push notification đến một FCM token
 * @param {string} token - FCM device token
 * @param {string} title - Tiêu đề notification
 * @param {string} body - Nội dung notification
 * @param {Object} data - Custom data payload (key-value strings)
 * @returns {Promise<string|null>} Message ID hoặc null nếu thất bại
 */
async function sendToToken(token, title, body, data = {}) {
  const fcmMessaging = initFirebase();
  if (!fcmMessaging) return null;

  try {
    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      }
    };

    const messageId = await fcmMessaging.send(message);
    console.log(`📱 FCM sent to token ${token.substring(0, 20)}...: ${messageId}`);
    return messageId;
  } catch (err) {
    console.error(`❌ FCM send failed for token ${token.substring(0, 20)}...:`, err.message);
    return null;
  }
}

/**
 * Gửi push notification đến nhiều tokens cùng lúc (batch)
 * @param {string[]} tokens - Mảng FCM device tokens
 * @param {string} title
 * @param {string} body
 * @param {Object} data
 * @returns {Promise<{successCount: number, failureCount: number}>}
 */
async function sendToMultipleTokens(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const fcmMessaging = initFirebase();
  if (!fcmMessaging) return { successCount: 0, failureCount: tokens.length };

  try {
    const message = {
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: 'high' },
      tokens
    };

    const response = await fcmMessaging.sendEachForMulticast(message);
    console.log(`📱 FCM multicast: ${response.successCount} success, ${response.failureCount} failure`);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (err) {
    console.error('❌ FCM multicast failed:', err.message);
    return { successCount: 0, failureCount: tokens.length };
  }
}

/**
 * Tạo notification content cho từng trạng thái đơn hàng
 * @param {string} orderNumber - Mã đơn hàng (ORD-XXXXX)
 * @param {string} status - Trạng thái mới
 * @returns {{title: string, body: string}}
 */
function getOrderStatusNotification(orderNumber, status) {
  const statusMessages = {
    confirmed:  { title: '✅ Đơn hàng đã xác nhận!', body: `Đơn ${orderNumber} đã được xác nhận. Chúng tôi đang chuẩn bị ngay!` },
    preparing:  { title: '👨‍🍳 Đang chuẩn bị đơn hàng', body: `Đơn ${orderNumber} đang được chế biến. Vui lòng chờ trong giây lát.` },
    delivering: { title: '🛵 Đơn hàng đang giao!', body: `Đơn ${orderNumber} đang trên đường đến bạn. Hãy sẵn sàng nhé!` },
    completed:  { title: '🎉 Giao hàng thành công!', body: `Đơn ${orderNumber} đã giao thành công. Chúc bạn ngon miệng!` },
    cancelled:  { title: '❌ Đơn hàng đã hủy', body: `Đơn ${orderNumber} đã được hủy. Liên hệ hỗ trợ nếu cần giải quyết.` }
  };

  return statusMessages[status] || {
    title: '📦 Cập nhật đơn hàng',
    body: `Đơn ${orderNumber} đã được cập nhật trạng thái: ${status}`
  };
}

function getOrderProgressNotification(orderNumber, trackingProgress) {
  const progress = Math.max(0, Math.min(100, Number(trackingProgress) || 0));
  return {
    title: '📦 Cập nhật tiến trình đơn hàng',
    body: `Đơn ${orderNumber} đã được cập nhật tiến trình: ${progress}%.`
  };
}

function getNewOrderNotification(orderNumber) {
  return {
    title: 'New order received',
    body: `Order ${orderNumber} is waiting for confirmation.`
  };
}

module.exports = {
  getFirebaseStatus,
  sendToToken,
  sendToMultipleTokens,
  getNewOrderNotification,
  getOrderStatusNotification,
  getOrderProgressNotification
};
