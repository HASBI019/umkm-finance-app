@echo off
echo 📦 Commit dan push ke GitHub...

git add .
git commit -m "🚀 Update otomatis - %date% %time%"
git push origin main

echo ✅ Selesai! Website kamu akan otomatis update di Vercel 💻🌐
pause
