import axios from "axios";

/**
 * Creates an instance of a token repository.
 */
function makeTokenRepository() {
    return {
        /**
         * Provides an access token for the given room name and identity.
         */
        async getToken(roomName: string, identity: string) {
            const response = await axios.post<{ token: string }>('[URL]/create-token', {
                roomName,
                identity
            });

            return response.data.token;
        }
    }
}

/**
 * An instance of a token repository.
 */
export const tokenRepository = makeTokenRepository();