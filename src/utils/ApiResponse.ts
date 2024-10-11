class ApiResponse {
  public success: boolean;
  constructor(
    public statusCode: number,
    public message = "Success",
    public data: any
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
  }
}
