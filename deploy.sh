#!/usr/bin/env bash
# يبني المشروع ويجهّز ملف الرفع النظيف: ~/storage/downloads/adhan-dist.zip
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo ">> تثبيت الحزم (مرة واحدة، قد يأخذ دقيقة)"
  npm install
fi

echo ">> تشغيل الاختبارات"
npm test

echo ">> بناء المشروع"
rm -rf dist
npm run build

# نحذف الـzip القديم أولًا حتى لا تبقى ملفات قديمة داخله
OUT="$HOME/storage/downloads/adhan-dist.zip"
rm -f "$OUT"
(cd dist && zip -r "$OUT" .)

echo ""
echo "تم. الملف جاهز للرفع: $OUT"
