# تشغيل أرضي V1 من الهاتف فقط

هذه النسخة تحافظ على تطبيق V1 نفسه، لكن التشغيل المحلي على الكمبيوتر لم يعد مطلوبًا.

## المكونات
- mobile: تطبيق المستخدم React Native + Expo.
- api: Backend Node/Express + Prisma.
- PostgreSQL: قاعدة البيانات.
- admin: لوحة الإدارة البسيطة.

## ما الذي تحتاجه من الهاتف؟
1. حساب GitHub.
2. حساب استضافة سحابية للـAPI وقاعدة البيانات (مثل Render/Railway/Supabase أو مزود مماثل).
3. Expo Go للاختبار، أو Expo/EAS لبناء APK.

## النشر
### 1) Backend + Database
ارفع مجلد المشروع إلى GitHub.
أنشئ PostgreSQL سحابية.
أنشئ Web Service للـAPI.
ضع متغيرات البيئة:
- DATABASE_URL
- JWT_SECRET
- PORT=4000
- CORS_ORIGIN=*

ثم شغّل:
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm start

### 2) التطبيق
في mobile ضع:
EXPO_PUBLIC_API_URL=https://YOUR-API-DOMAIN
ثم شغّل المشروع عبر Expo أو ابنِ APK عبر EAS.

> ملاحظة: لا تضع DATABASE_URL أو JWT_SECRET داخل تطبيق الهاتف. هذه أسرار خاصة بالسيرفر فقط.

## مهم قبل الإنتاج
هذه V1 تقنية. قبل استقبال أموال فعلية أو إصدار وحدات استثمارية فعلية يجب ربط النظام بالهيكل القانوني والتراخيص ومقدمي KYC والدفع والتوقيع/الحفظ المعتمدين، مع صلاحيات إدارية وMFA وسجل تدقيق ونسخ احتياطي ومراقبة.
