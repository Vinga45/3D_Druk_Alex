# Магазин 3D-виробів (Vercel)

Каталог, кошик, замовлення на пошту, адмінка для додавання товарів.
Товари й замовлення зберігаються в Upstash Redis, фото — у Vercel Blob.

## Розгортання
1. **GitHub**: створіть репозиторій і завантажте в нього всі файли цієї папки (кнопка Add file → Upload files). Папку `node_modules` не завантажуйте.
2. **Vercel**: vercel.com → Add New → Project → оберіть цей репозиторій → Deploy (Framework Preset: Other).
3. **Redis**: у проєкті вкладка Storage → Create Database → Upstash (Redis) → безкоштовний план → підключіть до проєкту.
4. **Фото**: Storage → Create → Blob → доступ Public → підключіть до проєкту.
5. **Змінні**: Settings → Environment Variables, додайте `ADMIN_PASSWORD`, `ORDER_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (приклад у `.env.example`). Для Gmail потрібен «пароль додатка».
6. **Перевипуск**: Deployments → ⋯ біля останнього → Redeploy (змінні діють лише на нові версії).
7. Магазин: головна адреса сайту. Адмінка: `/admin.html`.

## Адмінка
Увійти паролем `ADMIN_PASSWORD`. Додати/змінити/видалити товар, завантажити фото (стискається автоматично), побачити замовлення.
