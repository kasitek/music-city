import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "../config/env.js";
import { errorHandler } from "../middleware/error-handler.js";
import { notFoundHandler } from "../middleware/not-found.js";
import { apiRouter } from "../routes/index.js";
export const createApp = () => {
    const app = express();
    app.use(cors({
        origin: env.CLIENT_ORIGIN,
        credentials: true,
    }));
    app.use(helmet());
    app.use(morgan("dev"));
    app.use("/api/v1/uploads/content", express.raw({ type: "*/*", limit: "500mb" }));
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/v1", apiRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
};
