import { Router } from "express";
const healthRouter = Router();
healthRouter.get("/", (_request, response) => {
    response.json({
        ok: true,
        service: "music-city-server",
    });
});
export { healthRouter };
