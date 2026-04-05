# Finance Backend

This service powers a finance dashboard API built with Express, SQLite, JWT auth, and role-based permissions.

## What it does

- Handles user sign-up and login.
- Stores users and transactions in SQLite.
- Separates access for viewers, analysts, and admins.
- Exposes dashboard aggregates for reporting screens.

## Run it locally

1. Install packages with `npm install`.
2. Add a `.env` file in the project root.
3. Load the demo dataset with `npm run seed`.
4. Start the API with `npm start`.

### Environment

```env
PORT=3000
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=1d
```

## Roles

- `viewer` can read dashboard and transaction data.
- `analyst` can read data and manage their own transactions.
- `admin` can manage users and all records.

## Endpoint map

| Method | Path | Required Role |
| --- | --- | --- |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/users` | Admin |
| GET | `/users/:id` | Admin |
| PATCH | `/users/:id/role` | Admin |
| PATCH | `/users/:id/status` | Admin |
| DELETE | `/users/:id` | Admin |
| GET | `/transactions` | Viewer, Analyst, Admin |
| GET | `/transactions/:id` | Viewer, Analyst, Admin |
| POST | `/transactions` | Analyst, Admin |
| PUT | `/transactions/:id` | Analyst, Admin |
| DELETE | `/transactions/:id` | Analyst, Admin |
| GET | `/dashboard/summary` | Viewer, Analyst, Admin |
| GET | `/dashboard/categories` | Viewer, Analyst, Admin |
| GET | `/dashboard/trends` | Analyst, Admin |
| GET | `/dashboard/recent` | Viewer, Analyst, Admin |

## Auth flow

Login returns a JWT. Send the token in the request header:

```http
Authorization: Bearer <token>
```

## Example payloads

### Register

Request:

```json
{
  "name": "Maya Shah",
  "email": "maya.shah@example.com",
  "password": "Shah@2026!"
}
```

Response:

```json
{
  "message": "User registered successfully.",
  "userId": 4
}
```

### Login

Request:

```json
{
  "email": "admin@zorvyn.com",
  "password": "Admin@123"
}
```

Response:

```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@zorvyn.com",
    "role": "admin"
  }
}
```

### User management

Response from `GET /users`:

```json
{
  "users": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@zorvyn.com",
      "role": "admin",
      "status": "active",
      "created_at": "2026-04-06 10:00:00"
    }
  ]
}
```

Request to change a role:

```json
{
  "role": "analyst"
}
```

Response:

```json
{
  "message": "Role updated successfully."
}
```

### Transaction management

Create request:

```json
{
  "amount": 1499,
  "type": "expense",
  "category": "Cloud tools",
  "date": "2026-04-06",
  "notes": "Monthly platform billing"
}
```

Create response:

```json
{
  "message": "Transaction created successfully.",
  "transactionId": 11
}
```

Update request:

```json
{
  "notes": "Adjusted after invoice correction"
}
```

Update response:

```json
{
  "message": "Transaction updated successfully."
}
```

### Dashboard

Summary response:

```json
{
  "totalIncome": 8360,
  "totalExpenses": 2140,
  "netBalance": 6220
}
```

Recent activity response:

```json
{
  "recentActivity": [
    {
      "id": 10,
      "amount": 1150,
      "type": "income",
      "category": "Dividends",
      "date": "2026-04-05",
      "notes": "Investment return",
      "created_by": "Admin User"
    }
  ]
}
```

## Practical notes

- Transaction deletes are soft deletes; records stay in the database.
- Public sign-up always produces a `viewer` account.
- SQLite data is stored in `finance.db` at the repository root.