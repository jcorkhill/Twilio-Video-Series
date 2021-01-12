/**
 * Global application level configuration parameters.
 */
export const config = {
    twilio: {
        ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID as string,
        API_KEY: process.env.TWILIO_API_KEY as string,
        API_SECRET: process.env.TWILIO_API_SECRET as string
    }
} as const;