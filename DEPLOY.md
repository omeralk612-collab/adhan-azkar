# النشر (الطريقة التي نجحت فعليًا)

## 1) تجهيز ملف الرفع (في Termux)
```
cd ~/adhan-v2
bash deploy.sh
```
الناتج: `Downloads/adhan-dist.zip` (يُحذف القديم تلقائيًا فلا تتراكم ملفات قديمة).

## 2) الرفع على Cloudflare (من كروم)
dash.cloudflare.com > Compute (Workers) > Create > "Upload your static files"
اختر adhan-dist.zip، واكتب اسم المشروع، ثم Deploy.
(إن كان الاسم مستخدمًا فاختر اسمًا جديدًا.)

## 3) أو النشر التلقائي عبر GitHub
`git add . && git commit -m "تحديث" && git push` ثم ينشر الموقع المربوط تلقائيًا.

## بعد كل نشر
افتح الرابط، وإن ظهرت نسخة قديمة: قفل البيانات > بيانات الموقع > مسح.

## ملاحظات
- ملف الأذان public/audio/adhan.mp3 غير مرفق (ترخيص).
- نصوص الأذكار تحتاج مراجعة طالب علم.
