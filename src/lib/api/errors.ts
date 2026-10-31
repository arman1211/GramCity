export class ApiClientError extends Error {
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

export function throwApiError(
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApiClientError(code, message, details);
}
