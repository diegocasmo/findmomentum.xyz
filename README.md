# [https://www.findmomentum.xyz](https://www.findmomentum.xyz)

A productivity app that helps track and celebrate daily progress through small wins.

## Installation

1. Clone the repository

2. Install [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager)

3. Install and use the correct Node.js version

```bash
nvm install
nvm use
```

4. Set up the environment variables:

- Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

- Open the `.env` file and fill in the necessary environment variables, including your PostgreSQL database URL

5. Set up Prisma and the database:

- Generate Prisma client:

```bash
npx prisma generate
```

- Run migrations:

```bash
npx prisma migrate dev
```

These commands will set up your database schema and apply all existing migrations.

6. Install dependencies and start the development server

```bash
npm install
npm run dev
```

## Testing

1. Create the test database:

```bash
createdb momentum_test
```

2. Add `DATABASE_TEST_URL` to your `.env` file pointing at it:

```
DATABASE_TEST_URL=postgresql://localhost/momentum_test
```

The database name **must** contain the word "test" — the test setup file refuses to truncate any database that doesn't, protecting your development data.

3. Run the full suite once:

```bash
npm test
```

Or run in watch mode during development:

```bash
npm run test:watch
```

**Note:** `npm test` and `npm run test:watch` require `bash` (the `test:setup` script uses bash variable expansion to re-export `DATABASE_TEST_URL` as `DATABASE_URL` before migrating). macOS and Linux users have this by default. Windows users should use WSL2 or Git Bash.
