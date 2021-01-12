import { Request, Response } from 'express';
import { jwt } from 'twilio';

import { config } from './../config/config';
import { IGenerateVideoTokenRequestDto } from './dtos';

const AccessToken = jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

/**
 * Generates a video token for a given identity and room name.
 */
export function generateToken(req: Request, res: Response) {
    const dto = req.body as IGenerateVideoTokenRequestDto;

    // Generate an access token for the given identity.
    const token = new AccessToken(
        config.twilio.ACCOUNT_SID,
        config.twilio.API_KEY,
        config.twilio.API_SECRET,
        { identity: dto.identity }
    );

    // Grant access to Twilio Video capabilities.
    const grant = new VideoGrant({ room: dto.roomName });
    token.addGrant(grant);

    return res.send({ token: token.toJwt() });
}