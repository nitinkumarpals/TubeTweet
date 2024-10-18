class ApiResponse {
    public success: boolean;
    constructor(
        public statusCode: number,
        public data: any,
        public message: string = "Success",
    ) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
    }
}
export { ApiResponse };
