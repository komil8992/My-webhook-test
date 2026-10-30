const express = require('express');
const app = express();

// برای خواندن بدنه‌های JSON ارسالی به وب‌هوک
app.use(express.json());

// مسیر اصلی برای تست اینکه سرور زنده است
app.get('/', (req, res) => {
  res.send('Webhook server is running!');
});

// نقطه پایانی (Endpoint) وب‌هوک
app.post('/webhook', (req, res) => {
  const eventData = req.body;
  
  console.log('Received Webhook Event:', JSON.stringify(eventData, null, 2));

  // اینجا می‌توانید منطق دلخواه (مثل اتصال به Supabase یا پاسخ به TurboWarp) را پیاده کنید

  // پاسخ به فرستنده وب‌هوک که دریافت با موفقیت انجام شد
  return res.status(200).json({
    status: 'success',
    message: 'Webhook received successfully',
    receivedAt: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
