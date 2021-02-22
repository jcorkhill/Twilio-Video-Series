import { 
    connect,
    createLocalVideoTrack,
    RemoteAudioTrack, 
    RemoteParticipant, 
    RemoteTrack, 
    RemoteVideoTrack, 
    Room,
} from 'twilio-video';

import { tokenRepository } from './token-repository';

import { Nullable } from './types';

// UI Element Handles
const joinButton = document.querySelector('#join-button') as HTMLButtonElement;
const leaveButton = document.querySelector('#leave-button') as HTMLButtonElement;
const remoteMediaContainer = document.querySelector('#remote-media-container') as HTMLDivElement;
const localMediaContainer = document.querySelector('#local-media-container') as HTMLDivElement;
const roomNameInput = document.querySelector('#room-name-input') as HTMLInputElement;
const identityInput = document.querySelector('#identity-input') as HTMLInputElement;
const muteUnmuteAudioButton = document.querySelector('#mute-unmute-audio-button') as HTMLButtonElement;
const muteUnmuteVideoButton = document.querySelector('#mute-unmute-video-button') as HTMLButtonElement;

// Room reference
let room: Room;

// Global mute state
let isAudioMuted = false;
let isVideoMuted = false;

/**
 * Entry point.
 */
async function main() {
    // Initial state.
    leaveButton.disabled = true;
    joinButton.disabled = false;
    muteUnmuteAudioButton.disabled = true;
    muteUnmuteVideoButton.disabled = true;

    // Provides a camera preview window.
    const localVideoTrack = await createLocalVideoTrack({ width: 640 });
    localMediaContainer.appendChild(localVideoTrack.attach());
}

/**
 * Triggers when the join button is clicked.
 */
async function onJoinClick() {
    const roomName = roomNameInput.value;
    const identity = identityInput.value;
    room = await connect(await tokenRepository.getToken(roomName, identity), {
        name: roomName,
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
    
    toggleInputs();
}

/**
 * Triggers when the leave button is clicked.
 */
function onLeaveClick() {
    room.disconnect();
    toggleInputs();
}

enum TrackType {
    Audio,
    Video
}

/**
 * Callback function for click of a "mute" button.
 * 
 * @param trackType
 * The type of track to mute/unmute.
 */
function onMuteUnmuteClick(trackType: TrackType) {
    if (trackType === TrackType.Audio) {
        const opts = { audio: true, video: false };

        isAudioMuted
            ? unmute(opts)
            : mute(opts);

        isAudioMuted = !isAudioMuted;

        isAudioMuted
            ? muteUnmuteAudioButton.textContent = 'Unmute Audio'
            : muteUnmuteAudioButton.textContent = 'Mute Audio';
    }

    if (trackType === TrackType.Video) {
        const opts = { audio: false, video: true };

        isVideoMuted
            ? unmute(opts)
            : mute(opts);

        isVideoMuted = !isVideoMuted;

        isVideoMuted
            ? muteUnmuteVideoButton.textContent = 'Unmute Video'
            : muteUnmuteVideoButton.textContent = 'Mute Video';
    }
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
function onTrackSubscribed(track: RemoteTrack, participant: RemoteParticipant) {
    attachTrackEnabledDisabledHandlers(track, participant);

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
function onTrackUnsubscribed(track: RemoteTrack, participant: RemoteParticipant) {
    if (trackExistsAndIsAttachable(track))
        track.detach().forEach(element => element.remove());
}

/**
 * Callback for when a track is enabled.
 * 
 * @param track 
 * The remote track for which an `enabled` event has occurred.
 * 
 * @param participant 
 * The remote participant who owns the track for which an `enabled` event has occurred.
 */
function onTrackEnabled(track: RemoteTrack, participant: RemoteParticipant) {
    alert(`Track type ${track.kind} enabled for participant ${participant.identity}`);
}

/**
 * Callback for when a track is disabled.
 * 
 * @param track 
 * The remote track for which a `disabled` event has occurred.
 * 
 * @param participant 
 * The remote participant who owns the track for which an `disabled` event has occurred.
 */
function onTrackDisabled(track: RemoteTrack, participant: RemoteParticipant) {
    alert(`Track type ${track.kind} disabled for participant ${participant.identity}`);
}

/**
 * Manages track attachment and subscription for a remote participant.
 * 
 * @param participant 
 * The remote participant
 */
function manageTracksForRemoteParticipant(participant: RemoteParticipant) {
    // Attach tracks that this participant has already published.
    attachAttachableTracksForRemoteParticipant(participant);

    // Handle mute and unmute events for tracks this participant has already published.
    handleMuteAndUnmuteEventsForRemoteParticipant(participant);

    // Handles tracks that this participant eventually publishes.
    participant.on('trackSubscribed', (track: RemoteTrack) => onTrackSubscribed(track, participant));
    participant.on('trackUnsubscribed', (track: RemoteTrack) => onTrackUnsubscribed(track, participant));
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
 * Handles mute and unmute events for all tracks for a given participant.
 * 
 * @param participant 
 * The remote participant for which a mute/unmute event has occurred.
 */
function handleMuteAndUnmuteEventsForRemoteParticipant(participant: RemoteParticipant) {
    participant.tracks.forEach(publication => {
        if (!publication.isSubscribed)
            return;

        if (!publication.track)
            return;

        const track = publication.track;

        attachTrackEnabledDisabledHandlers(track, participant);
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
 * Attaches event handlers for enabled/disabled events.
 * 
 * @param track 
 * The remote track for which enabled/disabled events will fire.
 * 
 * @param participant 
 * The participant who owns the track.
 */
function attachTrackEnabledDisabledHandlers(track: RemoteTrack, participant: RemoteParticipant) {
    track.on('enabled', () => onTrackEnabled(track, participant));
    track.on('disabled', () => onTrackDisabled(track, participant));
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

/**
 * Granular track-control for which mute and unmute operations can be applied.
 */
interface IMuteUnmuteOptions {
    audio: boolean;
    video: boolean;
}

/**
 * Mutes the local participant's tracks based on the specified options.
 * 
 * @param opts
 * Specifies which kind of tracks to mute.
 */
function mute(opts: IMuteUnmuteOptions) {
    if (!room || !room.localParticipant)
        throw new Error('You must be connected to a room to mute tracks.');

    if (opts.audio) {
        room.localParticipant.audioTracks.forEach(
            publication => publication.track.disable()
        );
    }
    
    if (opts.video) {
        room.localParticipant.videoTracks.forEach(
            publication => publication.track.disable()
        );
    }
}

/**
 * Unmutes the local participant's tracks based on the specified options.
 * 
 * @param opts
 * Specifies which kind of tracks to unmute.
 */
function unmute(opts: IMuteUnmuteOptions) {
    if (!room || !room.localParticipant)
        throw new Error('You must be connected to a room to unmute tracks.');

    if (opts.audio) {
        room.localParticipant.audioTracks.forEach(
            publication => publication.track.enable()
        );
    }
    
    if (opts.video) {
        room.localParticipant.videoTracks.forEach(
            publication => publication.track.enable()
        );
    }
}

/**
 * Toggles inputs into their opposite form in terms of whether they're disabled.
 */
function toggleInputs() {
    joinButton.disabled = !joinButton.disabled;
    leaveButton.disabled = !leaveButton.disabled;
    muteUnmuteAudioButton.disabled = !muteUnmuteAudioButton.disabled;
    muteUnmuteVideoButton.disabled = !muteUnmuteVideoButton.disabled;

    identityInput.value = '';
    roomNameInput.value = '';
}

// Button event handlers.
joinButton.addEventListener('click', onJoinClick);
leaveButton.addEventListener('click', onLeaveClick);
muteUnmuteAudioButton.addEventListener('click', () => onMuteUnmuteClick(TrackType.Audio));
muteUnmuteVideoButton.addEventListener('click', () => onMuteUnmuteClick(TrackType.Video));

// Entry point.
main();
