const Device = require('../models/Device');

/**
 * POST /api/devices/register
 * Đăng ký FCM token cho user hiện tại
 * Body: { fcmToken, platform, deviceId }
 */
exports.registerDevice = async (req, res) => {
  try {
    const { fcmToken, platform = 'android', deviceId = '' } = req.body;

    if (!fcmToken || !fcmToken.trim()) {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    // Upsert: nếu token đã tồn tại → update userId (login trên thiết bị khác)
    // Nếu chưa → tạo mới
    const device = await Device.findOneAndUpdate(
      { fcmToken: fcmToken.trim() },
      {
        userId: req.user.id,
        fcmToken: fcmToken.trim(),
        platform,
        deviceId: deviceId || '',
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`📱 Device registered: userId=${req.user.id} token=${fcmToken.substring(0, 20)}...`);

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      deviceId: device._id
    });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({ success: false, message: 'Failed to register device', error: error.message });
  }
};

/**
 * DELETE /api/devices/unregister
 * Hủy đăng ký FCM token (gọi khi user logout)
 * Body: { fcmToken }
 */
exports.unregisterDevice = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    await Device.findOneAndUpdate(
      { fcmToken: fcmToken.trim(), userId: req.user.id },
      { isActive: false }
    );

    res.json({ success: true, message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Unregister device error:', error);
    res.status(500).json({ success: false, message: 'Failed to unregister device', error: error.message });
  }
};
