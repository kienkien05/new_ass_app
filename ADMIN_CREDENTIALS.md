# Admin Credentials

These are the default admin credentials found in the seed script (`backend/scripts/seed.js`).

**Email**: `admin@evient.com`
**Password**: `admin123`

## Troubleshooting
If these credentials do not work, the database might need to be reset. You can re-run the seed command:

```bash
docker compose exec backend npm run seed
```

This will **delete all existing data** and recreate the admin account with the password above.
