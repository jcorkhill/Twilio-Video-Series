import { 
    connect,
    createLocalVideoTrack,
    RemoteAudioTrack, 
    RemoteParticipant, 
    RemoteTrack, 
    RemoteVideoTrack, 
    Room
} from 'twilio-video';

import { tokenRepository } from './token-repository';

import { Nullable } from './types';

// UI Element Handles
const joinButton = document.querySelector('#join-button') as HTMLButtonElement;
const remoteMediaContainer = document.querySelector('#remote-media-container') as HTMLDivElement;
const localMediaContainer = document.querySelector('#local-media-container') as HTMLDivElement;

/**
 * Entry point.
 */
async function main() {
    // Provides a camera preview window.
    const localVideoTrack = await createLocalVideoTrack({ width: 640 });
    localMediaContainer.appendChild(localVideoTrack.attach());
}

/**
 * Triggers when the join button is clicked.
 */
async function onJoinClick() {
    joinButton.disabled = true;

    const room = await connect(tokenRepository.getNextToken(), {
        name: 'room-name',
        audio: true,
        video: { width: 640 }
    });

    // Attach the remote tracks of participants already in the room.
    room.participants.forEach(
        participant => manageTracksForRemoteParticipant(participant)
    );

    // Wire-up event handlers.
    room.on('participantConnected', onParticipantConnected);
    room.on('participantDisconnected', onParticipantDisconnected);
    window.onbeforeunload = () => room.disconnect();
}

/**
 * Triggers when a remote participant connects to the room.
 * 
 * @param participant 
 * The remote participant
 */
function onParticipantConnected(participant: RemoteParticipant) {
    manageTracksForRemoteParticipant(participant);
}

/**
 * Triggers when a remote participant disconnects from the room.
 * 
 * @param participant 
 * The remote participant
 */
function onParticipantDisconnected(participant: RemoteParticipant) {
    document.getElementById(participant.sid)?.remove();
}

/**
 * Triggers when a remote track is subscribed to.
 * 
 * @param track 
 * The remote track
 */
function onTrackSubscribed(track: RemoteTrack) {
    if (!trackExistsAndIsAttachable(track))
        return;

    attachTrack(track);
}

/**
 * Triggers when a remote track is unsubscribed from.
 * 
 * @param track 
 * The remote track
 */
function onTrackUnsubscribed(track: RemoteTrack) {
    if (trackExistsAndIsAttachable(track))
        track.detach().forEach(element => element.remove());
}

/**
 * Manages track attachment and subscription for a remote participant.
 * 
 * @param participant 
 * The remote participant
 */
function manageTracksForRemoteParticipant(participant: RemoteParticipant) {
    // Handle tracks that this participant has already published.
    attachAttachableTracksForRemoteParticipant(participant);

    // Handles tracks that this participant eventually publishes.
    participant.on('trackSubscribed', onTrackSubscribed);
    participant.on('trackUnsubscribed', onTrackUnsubscribed);
}


/**
 * Attaches all attachable published tracks from the remote participant.
 * 
 * @param publications 
 * The list of possible publications to attach.
 */
function attachAttachableTracksForRemoteParticipant(participant: RemoteParticipant) {
    participant.tracks.forEach(publication => {
        if (!publication.isSubscribed)
            return;

        if (!trackExistsAndIsAttachable(publication.track))
            return;

        attachTrack(publication.track);
    });
}

/**
 * Attaches a remote track.
 * 
 * @param track 
 * The remote track to attach.
 */
function attachTrack(track: RemoteAudioTrack | RemoteVideoTrack) {
    remoteMediaContainer.appendChild(track.attach());
}

/**
 * Guard that a track is attachable.
 * 
 * @param track 
 * The remote track candidate.
 */
function trackExistsAndIsAttachable(track?: Nullable<RemoteTrack>): track is RemoteAudioTrack | RemoteVideoTrack {
    return !!track && (
        (track as RemoteAudioTrack).attach !== undefined ||
        (track as RemoteVideoTrack).attach !== undefined
    );
}

// Button event handlers.
joinButton.addEventListener('click', onJoinClick);

// Entry point.
main();
