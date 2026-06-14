import { BaseProfile } from './BaseProfile.js';

export function getDeviceCapabilities() {
    return {
        platform: 'androidtv',
        maxResolution: '4K',
        supports4K: true,
        supportsHEVC: true,
        supportsAV1: true,
        supportsVP9: true,
        supportsHDR: true,
        supportsDolbyVision: true,
        supportsDirectPlay: true
    };
}

export function clearCapabilitiesCache() {}

export function buildJellyfinProfile(options = {}) {
    const bitrate = options.manualBitrate || 120000000;
    return {
        MaxStreamingBitrate: bitrate,
        MaxStaticBitrate: bitrate,
        MusicStreamingTranscodingBitrate: 384000,
        DirectPlayProfiles: [
            { Type: 'Video', Container: 'mp4,m4v,mkv,webm,ts,m2ts', VideoCodec: 'h264,hevc,av1,vp9,mpeg2video', AudioCodec: 'aac,mp3,ac3,eac3,flac,opus,vorbis' },
            { Type: 'Audio', Container: 'mp3,aac,m4a,flac,ogg,opus', AudioCodec: 'mp3,aac,flac,opus,vorbis' }
        ],
        TranscodingProfiles: [
            { Container: 'ts', Type: 'Video', AudioCodec: 'aac,mp3,ac3,eac3', VideoCodec: 'h264', Protocol: 'hls', EstimateContentLength: false, EnableMpegtsM2TsMode: false, TranscodeSeekInfo: 'Auto', CopyTimestamps: false, Context: 'Streaming', MaxAudioChannels: '8', MinSegments: '2', BreakOnNonKeyFrames: true },
            { Container: 'mp3', Type: 'Audio', AudioCodec: 'mp3', Protocol: 'http' }
        ],
        ContainerProfiles: [],
        CodecProfiles: [],
        ResponseProfiles: BaseProfile.getResponseProfiles(),
        SubtitleProfiles: BaseProfile.getSubtitleProfiles()
    };
}

export function getDeviceId() {
    return BaseProfile.getFallbackDeviceId('litefin_androidtv_');
}

export function getDeviceName() {
    return 'Litefin Android TV';
}
