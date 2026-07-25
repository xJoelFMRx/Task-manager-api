# Task Manager API

![CI](https://github.com/xJoelFMRx/Task-manager-api/actions/workflows/ci.yml/badge.svg)

A RESTful API for user and task management, built with Node.js, Express, and MongoDB.

## Features

- Secure JWT authentication
- Full CRUD for tasks, scoped per user
- Profile update and account deletion (with cascade delete of related tasks)
- Robust input validation (email format and password strength) and centralized error handling
- Language support (English/Spanish) via the `Accept-Language` header
- Automated tests with Jest and Supertest
- Clean MVC architecture

## Tech stack

- Node.js
- Express 5
- MongoDB (Mongoose)
- JWT (jsonwebtoken)
- bcryptjs
- express-validator
- Jest + Supertest (testing)

## Architecture

The backend follows an MVC architecture:

- **Models**: Defined with Mongoose (`User`, `Task`).
- **Controllers**: Business logic and validation.
- **Routes**: Separated by resource (users, tasks).
- **Middlewares**: JWT authentication, centralized error handling, request validation, language detection.

```
src/
├── app.js                  # Express app setup and route mounting
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── taskController.js     # Task business logic
│   └── userController.js     # Auth and profile business logic
├── i18n/
│   ├── index.js               # Combines messages.en.json/messages.es.json into a single lookup object
│   ├── messages.en.json       # English messages
│   └── messages.es.json       # Spanish messages
├── middlewares/
│   ├── auth.js                 # JWT authentication middleware
│   ├── errorHandler.js         # Centralized error handler
│   ├── i18n.js                  # Detects language (Accept-Language) and attaches req.t
│   └── validate.js             # express-validator error-handling middleware
├── models/
│   ├── task.js                  # Task schema
│   └── user.js                   # User schema
├── routes/
│   ├── taskRoutes.js           # /api/tasks endpoints
│   └── userRoutes.js           # /api/register, /api/login, /api/profile endpoints
└── utils/
    ├── AppError.js               # Custom error class
    └── validators.js             # Shared email/password regex
```

## Getting started

1. Clone the repository.
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the project root with the following variables:
   ```
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   ```
4. Start the server in development mode:
   ```
   npm run dev
   ```

## Main endpoints

| Method | Endpoint            | Description                                              | Auth required |
|--------|---------------------|------------------------------------------------------------|:--------------:|
| POST   | `/api/register`     | Register a new user                                       | No             |
| POST   | `/api/login`        | Log in and get a JWT                                       | No             |
| GET    | `/api/profile-info` | Protected route, returns the decoded user from the token   | Yes            |
| PATCH  | `/api/profile`      | Update the authenticated user's email and/or password      | Yes            |
| DELETE | `/api/profile`      | Delete the authenticated user and all of their tasks        | Yes            |
| POST   | `/api/tasks`        | Create a task                                               | Yes            |
| GET    | `/api/tasks`        | List all tasks belonging to the authenticated user           | Yes            |
| GET    | `/api/tasks/:id`    | Get a single task by id (only if owned by the user)          | Yes            |
| PUT    | `/api/tasks/:id`    | Update a task's `title` and/or `completed` fields            | Yes            |
| DELETE | `/api/tasks/:id`    | Delete a task                                                | Yes            |

All protected endpoints require the JWT in the request header:

```
Authorization: Bearer <your_token>
```

## Language support (i18n)

Response messages are available in English (default) and Spanish. Send the `Accept-Language` header to choose:

```
Accept-Language: es
```

Any value other than `es` (or no header at all) falls back to English.

## Validation rules

- **Email**: must match a standard `local@domain.tld` format.
- **Password** (on register and profile update): at least 6 characters, including at least one uppercase letter, one lowercase letter, and one number.
- **Task title**: required, non-empty string. A user cannot have two tasks with the exact same title (`409 Conflict` if attempted).
- **Email already registered**: registering with an email that's already in use returns `409 Conflict`. Updating your profile (`PATCH /api/profile`) to an email already used by another account also returns `409 Conflict`.
- **Invalid task id**: requesting a task with a malformed id (not a valid MongoDB ObjectId) returns `404 Not Found`.

## Error responses

All errors are returned with a consistent shape, regardless of their source (controllers, authentication, validation, or the centralized error handler):

```json
{
  "message": "Descriptive error message."
}
```

The message is localized according to the `Accept-Language` header (see below). Consumers only need to read `res.body.message` to display an error.

## Security and cascade delete

- Passwords are hashed with `bcryptjs` before being stored.
- All protected routes are guarded by JWT-based authentication middleware.
- When a user is deleted via `DELETE /api/profile`, all tasks associated with that user are automatically deleted as well (cascade delete), so no orphaned or otherwise-inaccessible data remains.

## Usage examples

### Register a user
`POST /api/register`
```json
{
  "email": "test@gmail.com",
  "password": "Password1"
}
```
Response:
```json
{
  "message": "User registered successfully."
}
```

### Log in
`POST /api/login`
```json
{
  "email": "test@gmail.com",
  "password": "Password1"
}
```
Response:
```json
{
  "token": "eyJhbGciOi..."
}
```

### Create a task
`POST /api/tasks`
Headers:
- `Authorization: Bearer <your_token>`
```json
{
  "title": "My first task"
}
```

### List tasks
`GET /api/tasks`
Headers:
- `Authorization: Bearer <your_token>`

### Update a task
`PUT /api/tasks/:id`
Headers:
- `Authorization: Bearer <your_token>`
```json
{
  "title": "Updated task",
  "completed": true
}
```

### Delete a task
`DELETE /api/tasks/:id`
Headers:
- `Authorization: Bearer <your_token>`

### Update email or password
`PATCH /api/profile`
Headers:
- `Authorization: Bearer <your_token>`
```json
{
  "email": "new@email.com",
  "password": "NewPassword1"
}
```
You can send only one of the fields (`email` or `password`), or both.

### Delete account and tasks
`DELETE /api/profile`
Headers:
- `Authorization: Bearer <your_token>`

Response:
```json
{
  "message": "User and tasks deleted successfully."
}
```

## Running the tests

To run the automated test suite:

```
npm test
```

This runs every test under the `tests/` folder using Jest and Supertest, covering happy paths, validation errors, i18n behavior, and security/ownership edge cases (e.g. a user cannot read, update, or delete another user's tasks). You don't need Postman to run these.

## Manual testing with Postman

You can also exercise the API manually with Postman:

1. Register a user via `/api/register`.
2. Log in via `/api/login` and copy the JWT from the response.
3. Use that token in the `Authorization: Bearer <your_token>` header to call the task endpoints (`/api/tasks`).

## Production recommendations

- Use secure environment variables and never commit secrets.
- Configure CORS according to your frontend's origin.
- Add rate limiting and request logging if the API is exposed publicly.
- Keep dependencies up to date.

## License

MIT
