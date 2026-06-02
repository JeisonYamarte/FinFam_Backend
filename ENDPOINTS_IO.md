# FinFam API - Entradas y Salidas por Endpoint

Base URL:

- /api/v1

Notas generales:

- Endpoints protegidos requieren Authorization: Bearer <access_token>.
- Algunos endpoints usan cookies HTTP-only para refresh_token.
- Los tipos Date/DateTime se devuelven en formato ISO en JSON.

## Auth

### POST /api/v1/auth/login

Entrada:

- Body: email, password

Salida:

- Body: user, access_token
- user: id, name, lastName, birthDate, email, verifiedEmail, createdAt, updatedAt
- Cookie set: refresh_token

### POST /api/v1/auth/register

Entrada:

- Body: email, password, name, lastName, birthDate

Salida:

- Body: user, access_token
- user: id, name, lastName, birthDate, email, verifiedEmail, createdAt, updatedAt
- Cookie set: refresh_token

### POST /api/v1/auth/refresh

Entrada:

- Cookie: refresh_token

Salida:

- Body: access_token
- Cookie set: refresh_token

### POST /api/v1/auth/logout

Entrada:

- Cookie: refresh_token (si existe)

Salida:

- Body: message
- Cookie clear: refresh_token

### GET /api/v1/auth/verify-email

Entrada:

- Query: token

Salida:

- Body: message

### POST /api/v1/auth/forgot-password

Entrada:

- Body: email

Salida:

- Body: message

### GET /api/v1/auth/me

Entrada:

- Header: Authorization (Bearer token)

Salida:

- Body: id, name, lastName, birthDate, email, verifiedEmail, createdAt, updatedAt

### POST /api/v1/auth/reset-password

Entrada:

- Body: token, newPassword

Salida:

- Body: message

## Users

### POST /api/v1/users

Entrada:

- Body: name, lastName, birthDate, email, password, emailVerified (opcional)

Salida:

- Body: id, name, lastName, birthDate, email, verifiedEmail, createdAt, updatedAt

### GET /api/v1/users

Entrada:

- Query: name (opcional), lastName (opcional), email (opcional), page (opcional), limit (opcional)

Salida:

- Body: data, meta
- data[] item: id, name, lastName, birthDate, email, verifiedEmail, createdAt, updatedAt
- meta: total, page, limit, totalPages

### GET /api/v1/users/:id

Entrada:

- Param: id

Salida:

- Body: id, name, lastName, birthDate, email, verifiedEmail, createdAt, updatedAt

### PATCH /api/v1/users/:id

Entrada:

- Param: id
- Body (todos opcionales): name, lastName, birthDate, email, password, emailVerified

Salida:

- Body: id, name, lastName, birthDate, email, verifiedEmail, createdAt, updatedAt

### DELETE /api/v1/users/:id

Entrada:

- Param: id

Salida:

- Body: message

## Homes

### POST /api/v1/homes

Entrada:

- Header: Authorization (Bearer token)
- Body: name

Salida:

- Body: id, name, createdAt

### GET /api/v1/homes

Entrada:

- Header: Authorization (Bearer token)

Salida:

- Body: array
- item: id, name, role

### GET /api/v1/homes/:homeId

Entrada:

- Header: Authorization (Bearer token)
- Param: homeId

Salida:

- Body: id, name, createdAt, membersCount

### PATCH /api/v1/homes/:homeId

Entrada:

- Header: Authorization (Bearer token)
- Param: homeId
- Body: name (opcional)

Salida:

- Body: id, name, updatedAt

### DELETE /api/v1/homes/:homeId

Entrada:

- Header: Authorization (Bearer token)
- Param: homeId

Salida:

- Body: message

### GET /api/v1/homes/:homeId/members

Entrada:

- Header: Authorization (Bearer token)
- Param: homeId

Salida:

- Body: array
- item: id, userId, name, email, role

### PATCH /api/v1/homes/:homeId/members/:memberId/role

Entrada:

- Header: Authorization (Bearer token)
- Param: homeId, memberId
- Body: role

Salida:

- Body: id, userId, role

### DELETE /api/v1/homes/:homeId/members/:memberId

Entrada:

- Header: Authorization (Bearer token)
- Param: homeId, memberId

Salida:

- Body: message

### POST /api/v1/homes/:homeId/invitations

Entrada:

- Header: Authorization (Bearer token)
- Param: homeId
- Body: email

Salida:

- Body: message

### POST /api/v1/homes/:homeId/leave

Entrada:

- Header: Authorization (Bearer token)
- Param: homeId

Salida:

- Body: message

## Invitations

### POST /api/v1/invitations/:invitationId/accept

Entrada:

- Param: invitationId

Salida:

- Body: message

### POST /api/v1/invitations/:invitationId/decline

Entrada:

- Param: invitationId

Salida:

- Body: message

## Expenses

### POST /api/v1/expenses

Entrada:

- Header: Authorization (Bearer token)
- Body/FormData: householdId, title, description (opcional), amount, date, payers, splits, receipt (archivo opcional)
- payers[] item: userId, amountPaid
- splits[] item: userId, amount

Salida:

- Body: id, title, description, amount, date, receiptUrl, receiptPublicId, householdId, closureId, createdBy, createdAt, updatedAt

### GET /api/v1/households/:householdId/expenses

Entrada:

- Header: Authorization (Bearer token)
- Param: householdId
- Query: startDate (opcional), endDate (opcional), closureId (opcional), page (opcional), limit (opcional)

Salida:

- Body: data, meta
- data[] item: id, title, amount, date, closureId
- meta: total, page, limit, totalPages

### GET /api/v1/households/:householdId/expenses/calculation

Entrada:

- Header: Authorization (Bearer token)
- Param: householdId

Salida:

- Body: period, openExpensesCount, totalSpentOpenPeriod, totalsByUser
- period: startDate, endDate
- totalsByUser[userId]: paid, split, net

### GET /api/v1/expenses/:expenseId

Entrada:

- Header: Authorization (Bearer token)
- Param: expenseId

Salida:

- Body: id, title, description, amount, date, receiptUrl, receiptPublicId, householdId, closureId, createdBy, createdAt, updatedAt, payers, splits
- payers[] item: id, userId, amountPaid, user
- payers[].user: name, lastName
- splits[] item: id, userId, amount, user
- splits[].user: name, lastName

### PATCH /api/v1/expenses/:expenseId

Entrada:

- Header: Authorization (Bearer token)
- Param: expenseId
- Body/FormData (todos opcionales): title, description, amount, date, payers, splits, receipt
- payers[] item: userId, amountPaid
- splits[] item: userId, amount

Salida:

- Body: id, title, description, amount, date, receiptUrl, receiptPublicId, householdId, closureId, createdBy, createdAt, updatedAt

### DELETE /api/v1/expenses/:expenseId

Entrada:

- Header: Authorization (Bearer token)
- Param: expenseId

Salida:

- Body: message

### PUT /api/v1/expenses/:expenseId/payers

Entrada:

- Header: Authorization (Bearer token)
- Param: expenseId
- Body: payers
- payers[] item: userId, amountPaid

Salida:

- Body: array
- item: id, expenseId, userId, amountPaid, updatedAt

### PUT /api/v1/expenses/:expenseId/splits

Entrada:

- Header: Authorization (Bearer token)
- Param: expenseId
- Body: splits
- splits[] item: userId, amount

Salida:

- Body: array
- item: id, expenseId, userId, amount, updatedAt

## Closures

### POST /api/v1/closures/simulate

Entrada:

- Header: Authorization (Bearer token)
- Body: householdId

Salida:

- Body: period, expensesCount, balances, debts
- period: startDate, endDate
- balances[] item: fromUserId, toUserId, amount
- debts[] item: fromUserId, toUserId, amount

### POST /api/v1/closures

Entrada:

- Header: Authorization (Bearer token)
- Body: householdId

Salida:

- Body: closureId, balances
- balances[] item: fromUserId, toUserId, amount

### GET /api/v1/households/:householdId/closures

Entrada:

- Header: Authorization (Bearer token)
- Param: householdId
- Query: offset (opcional), limit (opcional)

Salida:

- Body: array
- item: id, startDate, endDate, createdAt

### GET /api/v1/closures/:closureId

Entrada:

- Header: Authorization (Bearer token)
- Param: closureId

Salida:

- Body: id, householdId, startDate, endDate, createdAt, updatedAt, balances
- balances[] item: fromUserId, toUserId, amount

### GET /api/v1/closures/:closureId/balances

Entrada:

- Header: Authorization (Bearer token)
- Param: closureId

Salida:

- Body: array
- item: fromUserId, toUserId, amount

### GET /api/v1/closures/:closureId/expenses

Entrada:

- Header: Authorization (Bearer token)
- Param: closureId

Salida:

- Body: array
- item: id, title, description, amount, date, receiptUrl, createdAt, updatedAt, payers, splits
- payers[] item: userId, amountPaid
- splits[] item: userId, amount

## Tests

### GET /api/v1/tests

Entrada:

- Header: Authorization (Bearer token)

Salida:

- Body: message

### POST /api/v1/tests/upload

Entrada:

- FormData: file

Salida:

- Body: url, publicId, format, bytes
