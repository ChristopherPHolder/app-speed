/**
 *
 * HTTP response status codes extracted from MDM WEB DOCS https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *
 * Notes:
 * This is using const enums because it decreases the bundle size. This is because const enums do not exist ar runtime,
 * so it ends up inlining the values.
 *
 */

export const enum RESPONSE_SUCCESSFUL {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  MULTI_STATUS = 207,
  ALREADY_REPORTED = 208,
  IM_USED = 226,
}
export const enum RESPONSE_SERVER_ERROR {
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  VARIANT_ALSO_NEGOTIATES = 506,
  INSUFFICIENT_STORAGE = 507,
  LOOP_DETECTED = 508,
  NOT_EXTENDED = 510,
  NETWORK_AUTHENTICATION_REQUIRED = 511,
}
