/**
 * Incoming request DTO data shape for creating a token.
 */
export interface IGenerateVideoTokenRequestDto {
    identity: string;
    roomName: string;
}

/**
 * Outgoing response DTO containing a video token.
 */
export interface IVideoTokenResponseDto {
    token: string;
}
