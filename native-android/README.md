# AYHEM AI — Native Android

مشروع Android مستقل باستخدام Kotlin وJetpack Compose.

## إعدادات البناء
- compileSdk: 34
- targetSdk: 34
- minSdk: 24
- Java: 17
- Android Gradle Plugin: 8.7.3
- Kotlin: 2.0.21

## البناء في Android Studio
افتح مجلد `native-android` ثم انتظر Gradle Sync، وبعدها اختر Build > Build APK(s).

## ملاحظات
- Splash Screen مدتها ثانيتان داخل Compose ثم انتقال تلقائي إلى الرئيسية.
- لا يطلب التطبيق أذونات خطرة أو غير لازمة في النسخة الأساسية.
- هذه نسخة أساس Native جديدة؛ لا تتضمن بعد مزامنة Supabase أو تشغيل TinyFish أو نقل بيانات الإصدار القديم.
- لا يمكن ضمان التوافق المطلق قبل اختبار APK على أجهزة فعلية متعددة.
