import { logger } from '../utils/Logger.js';

const log = logger.create('AndroidMedia3Player');
const TICKS_PER_SECOND = 10000000;

export class AndroidMedia3Player {
    constructor(options) {
        this.container = options.container;
        this.onEvent = options.onEvent || (() => {});
        this._currentPlayOptions = null;
        this._volume = 1;
        this._timeUpdateTimer = null;
        window.__litefinAndroidPlayerEvent = (event) => this._handleNativeEvent(event);
    }

    static isAvailable() {
        return !!window.LitefinAndroidPlayer?.isAvailable?.();
    }

    async play(options) {
        this._currentPlayOptions = options;
        window.LitefinAndroidPlayer.play(JSON.stringify({
            url: options.url,
            startPosition: (options.startPositionTicks || 0) / TICKS_PER_SECOND,
            isHls: !!options.isHls
        }));
        this._startTimeUpdates();
    }

    pause() { window.LitefinAndroidPlayer.pause(); }
    unpause() { window.LitefinAndroidPlayer.unpause(); }

    async stop() {
        this._stopTimeUpdates();
        window.LitefinAndroidPlayer.stop();
    }

    seek(positionTicks) {
        window.LitefinAndroidPlayer.seek(positionTicks / TICKS_PER_SECOND);
    }

    setVolume(volume) {
        this._volume = Math.max(0, Math.min(1, volume));
        window.LitefinAndroidPlayer.setVolume(this._volume);
    }

    getVolume() { return this._volume; }
    setSpeed(speed) { window.LitefinAndroidPlayer.setSpeed(speed); }
    toggleMute() { this.setMuted(!this.isMuted()); }
    setMuted(muted) { this.setVolume(muted ? 0 : 1); }
    isMuted() { return this._volume === 0; }
    setAudioStreamIndex() { log.info('Audio track changes are handled by Jellyfin remux on Android TV'); }
    setSubtitleStreamIndex() { log.info('Subtitles are rendered by Litefin overlays on Android TV'); }
    supportsNativeAudioTracks() { return false; }
    setAspectRatio() {}
    setSubtitleOffset() {}
    getCurrentTime() { return window.LitefinAndroidPlayer.getCurrentTime(); }
    getDuration() { return window.LitefinAndroidPlayer.getDuration(); }
    getStartPositionTicks() { return this._currentPlayOptions?.startPositionTicks || 0; }
    isPaused() { return window.LitefinAndroidPlayer.isPaused(); }
    toggleFullscreen() {}
    isFullscreen() { return true; }
    destroy() { this.stop(); delete window.__litefinAndroidPlayerEvent; }

    _startTimeUpdates() {
        this._stopTimeUpdates();
        this._timeUpdateTimer = setInterval(() => {
            this.onEvent({ type: 'timeupdate', data: { time: this.getCurrentTime() } });
        }, 1000);
    }

    _stopTimeUpdates() {
        if (this._timeUpdateTimer) clearInterval(this._timeUpdateTimer);
        this._timeUpdateTimer = null;
    }

    _handleNativeEvent(event) {
        if (!event?.type) return;
        if (event.type === 'ended') {
            this._stopTimeUpdates();
            this.onEvent({ type: 'stop' });
            return;
        }
        this.onEvent({ type: event.type, data: event.data || {} });
    }
}
