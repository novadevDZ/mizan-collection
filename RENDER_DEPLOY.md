# دليل نشر تطبيق ميزان (MIZAN COLLECTION) على Render 🚀

تم تجهيز المشروع بالكامل للنشر الفوري على منصة **Render** كخدمة ويب (Web Service).

---

## 1. إعدادات النشر على Render (Render Web Service Settings)

عند إنشاء **New Web Service** في لوحة تحكم [Render Dashboard](https://dashboard.render.com):

| الإعداد (Field) | القيمة المطلوبة (Value) |
| :--- | :--- |
| **Language / Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free أو Starter (حسب رغبتك) |

> 💡 **ملاحظة:** تم تضمين ملف `render.yaml` تلقائياً في جذر المشروع. إذا قمت بربط مستودع GitHub، يمكنك اختيار **Blueprints** وسيتم ملء كل الإعدادات تلقائياً.

---

## 2. متغيرات البيئة في Render (Environment Variables)

في تبويب **Environment** داخل الخدمة على Render، قم بإضافة المتغيرات التالية:

| المتغير (Key) | القيمة (Value) | ضروري؟ | الوصف |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `production` | نعم | لتشغيل Express في نمط الإنتاج وتقديم ملفات Vite المترجمة |
| `PORT` | `3000` | نعم | المنفذ المخصص للخدمة |
| `GEMINI_API_KEY` | *(مفتاح Gemini API الخاص بك)* | نعم | لتشغيل الذكاء الاصطناعي (استخراج المنتجات، صياغة رسائل التحصيل، التحليل المالي) |
| `SUPER_ADMIN_EMAIL` | `admin@mizan.dz` *(أو بريدك)* | اختياري | لتحديد حساب المدير العام للنظام |
| `SUPER_ADMIN_SECRET` | *(رمز أمان من اختيارك)* | اختياري | لحماية بوابة لوحة التحكم المركزية |

---

## 3. ربط النطاق في Firebase (خطوة مهمة جداً لـ Auth و Firestore)

بعد اكتمال النشر والحصول على رابط موقعك من Render (مثال: `https://mizan-collection.onrender.com`):

1. افتح **[Firebase Console](https://console.firebase.google.com)** واذهب إلى مشروعك: `skillful-discovery-flcf1`.
2. من القائمة الجانبية، اختر **Authentication** ثم اضغط على تبويب **Settings**.
3. انزل إلى قسم **Authorized domains** (النطاقات المصرح بها).
4. اضغط على **Add domain** وأضف نطاق Render الخاص بك (مثل: `mizan-collection.onrender.com`).

> هذه الخطوة تضمن عمل تسجيل الدخول بحساب Google ومنع أخطاء `auth/unauthorized-domain`.

---

## 4. اختبار الإنتاج محلياً (Local Production Test)

إذا أردت تجربة ما سيقوم Render بتشغيله:
```bash
npm run build
npm start
```
سيتم تشغيل الخادم المبني على `http://localhost:3000`.
