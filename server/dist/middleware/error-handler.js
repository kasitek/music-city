import { HttpError } from "../utils/http-error.js";
export const errorHandler = (error, _request, response, _next) => {
    if (error instanceof HttpError) {
        response.status(error.statusCode).json({ error: error.message });
        return;
    }
    response.status(500).json({
        error: "Internal server error",
    });
};
