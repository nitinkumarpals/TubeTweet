class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string = "Something went wrong",
    public errors: any[] = [],
    public date: Date | null,
    public success: boolean = false,
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.date = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };
