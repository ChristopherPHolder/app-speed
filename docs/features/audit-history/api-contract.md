# API Contract: Audit History

Status: Active  
Owner: Christopher Holder  
Last Updated: 2026-07-31

## Endpoints

### `GET /api/audits/history`

Returns a cursor-paginated page for every installed audit kind.

### `GET /api/audits/user-flow/history`

Returns the same response shape filtered to user-flow audits.

Both endpoints are ordered by `createdAt desc, id desc` and accept:

- `limit` (optional): integer in `[1, 100]`, default `25`
- `cursor` (optional): opaque cursor returned by the previous page
- `status` (optional): comma-separated values from `SCHEDULED|IN_PROGRESS|COMPLETE`

## Success Response

```json
{
  "items": [
    {
      "kind": "user-flow",
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

Error codes are `INVALID_QUERY` (400), `INVALID_CURSOR` (400), and `INTERNAL_ERROR` (500).

## Related User-Flow Endpoints

- `POST /api/audits/user-flow/schedule`
- `GET /api/audits/user-flow/:id`
- `GET /api/audits/user-flow/:id/events`
- `GET /api/audits/user-flow/:id/result`
- `GET /api/audits/user-flow/:id/report`
