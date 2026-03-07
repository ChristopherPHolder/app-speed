# API Contract: Audit Runs

Status: Draft  
Owner: Christopher Holder  
Last Updated: 2026-03-03

## Endpoints

### `GET /api/audit/runs`
Returns a cursor-paginated page of run summaries ordered by `createdAt desc, id desc`.

#### Query Params
- `limit` (optional): integer in `[1, 100]`, default `25`
- `cursor` (optional): opaque base64url cursor from previous response
- `status` (optional): comma-separated statuses from `SCHEDULED|IN_PROGRESS|COMPLETE`

#### Success Response
```json
{
  "items": [
    {
      "auditId": "string",
      "title": "string",
      "status": "SCHEDULED",
      "resultStatus": null,
      "queuePosition": 0,
      "createdAt": "2026-03-03T10:00:00.000Z",
      "startedAt": null,
      "completedAt": null,
      "durationMs": null
    }
  ],
  "nextCursor": "opaque-cursor-or-null",
  "limit": 25
}
```

### `GET /api/audit/runs/:id`
Returns one run summary for details hydration.

#### Success Response
```json
{
  "auditId": "string",
  "title": "string",
  "status": "IN_PROGRESS",
  "resultStatus": null,
  "queuePosition": null,
  "createdAt": "2026-03-03T10:00:00.000Z",
  "startedAt": "2026-03-03T10:01:00.000Z",
  "completedAt": null,
  "durationMs": null
}
```

## Error Response
```json
{
  "code": "INVALID_QUERY",
  "message": "Human-readable explanation",
  "details": {
    "field": "value"
  }
}
```

### Error Codes
- `INVALID_QUERY` (400)
- `INVALID_CURSOR` (400)
- `RUN_NOT_FOUND` (404)
- `INTERNAL_ERROR` (500)

## Compatibility
Existing endpoints remain unchanged:
- `GET /api/audit/:id`
- `GET /api/audit/:id/result`
- `GET /api/audit/:id/events`
