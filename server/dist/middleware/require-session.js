import { tokenService } from "../services/token.service.js";
import { HttpError } from "../utils/http-error.js";
const readBearerToken = (authorizationHeader) => {
    if (!authorizationHeader?.startsWith("Bearer ")) {
        return null;
    }
    return authorizationHeader.slice("Bearer ".length).trim();
};
export const requireSession = (request, _response, next) => {
    const token = readBearerToken(request.headers.authorization);
    if (!token) {
        next(new HttpError(401, "Authentication required"));
        return;
    }
    request.session = tokenService.verifySession(token);
    next();
};
