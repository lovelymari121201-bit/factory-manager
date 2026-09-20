# Floorline production / Aiven MySQL setup

The browser app is configured to use a secure API when `window.FLOORLINE_API_BASE_URL` is set. The API in `server.js` stores each application state collection in Aiven MySQL in the `floorline_state` table.

## 1. Create the database table
Run `schema.sql` against the Aiven MySQL database.

## 2. Configure the server
Set:

- `DATABASE_URL` (or `MYSQL_URL`) = your Aiven MySQL connection URL
- `PORT` = hosting provider port (optional; defaults to 3000)
- `MYSQL_SSL=false` only if your provider explicitly requires disabling SSL. Aiven production should use SSL.

Do **not** put the database URL/password into the HTML or browser JavaScript.

## 3. Point the frontend to the API
Before loading the HTML, set:

```html
<script>window.FLOORLINE_API_BASE_URL = 'https://YOUR-BACKEND-DOMAIN';</script>
```

The provided HTML then uses `/api/state/<collection>` for reads/writes instead of `window.storage`.

## 4. Collections currently synchronized
`fl_employees`, `fl_workorders`, `fl_attendance`, `fl_permissions`, `fl_leaves`, `fl_sundayot`, `fl_finance`, `fl_powercuts`, and `fl_invoices`.

This provides a single database source of truth through the backend. Actual cloud deployment still requires your Aiven connection URL and a hosting provider/server environment.
