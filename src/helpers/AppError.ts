export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 400,
    public code?: string,
  ) {
    super(message);
  }
}
