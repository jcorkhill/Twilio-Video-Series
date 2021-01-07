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
        getNextToken() {
            if (!localStorage.getItem('tokenPointer'))
                localStorage.setItem('tokenPointer', String(0));

            let tokenPointer = parseInt(localStorage.getItem('tokenPointer')!); 
      
            if (tokenPointer >= tokens.length) {
                alert(`Maximum client count reached. Refresh all ${tokens.length} pages.`)
                localStorage.setItem('tokenPointer', String(0));
                throw new Error('Maximum client count reached.');
            }
        
            const token = tokens[tokenPointer];

            // Increment pointer
            localStorage.setItem('tokenPointer', (tokenPointer + 1).toString());

            return token;
        }
    }
}

/**
 * An instance of a token repository.
 */
export const tokenRepository = makeTokenRepository();