import axios from "axios";

/**
 * Creates an instance of a token repository.
 */
function makeTokenRepository() {
    const tokens = [
        '[TOKEN]',
        '[TOKEN]'
    ];

    return {
        /**
         * Provides the token for the current pointer, and iterates the 
         * pointer for the next usage.
         */
        async getToken(roomName: string, identity: string) {
            const response = await axios.post<{ token: string }>('http://localhost:3000/create-token', {
                roomName,
                identity
            });

            console.log(response.data.token)

            return response.data.token;
        }
    }
}

/**
 * An instance of a token repository.
 */
export const tokenRepository = makeTokenRepository();