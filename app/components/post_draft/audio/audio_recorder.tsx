// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Audio} from 'expo-av';
import React, {useState, useRef, useEffect} from 'react';
import {Alert, TouchableOpacity, ActivityIndicator} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    cancelAnimation,
} from 'react-native-reanimated';

import CompassIcon from '@components/compass_icon';
import {logError} from '@utils/log';

const WHISPER_URL = 'http://10.100.12.18:4000/v1/audio/transcriptions';
const WHISPER_HEALTH_URL = 'http://10.100.12.18:4000/health?model=whisper-1';
const WHISPER_TOKEN = 'sk-litellm-7kO2JQnSga4zN88TeW7BYhGl';
const WHISPER_MODEL = 'whisper-1';
const WHISPER_LANGUAGE = 'pt';

type Props = {
    value: string;
    updateValue: (value: string) => void;
    addFiles: (files: FileInfo[]) => void;
};

export default function AudioRecorder({value, updateValue, addFiles}: Props) {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    useEffect(() => {
        if (isRecording) {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.2, {duration: 500}),
                    withTiming(1, {duration: 500}),
                ),
                -1,
            );
        } else {
            cancelAnimation(opacity);
            opacity.value = withTiming(1, {duration: 100});
        }
    }, [isRecording, opacity]);

    async function startRecording() {
        try {
            if (recording) {
                return;
            }

            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const {recording: newRecording} =
                await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY,
                );

            setRecording(newRecording);
            setIsRecording(true);
        } catch (err) {
            logError('[AudioRecorder.startRecording]', err);
        }
    }

    async function checkModelHealth(): Promise<boolean> {
        try {
            const res = await fetch(WHISPER_HEALTH_URL, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${WHISPER_TOKEN}`,
                },
            });

            if (!res.ok) {
                return false;
            }

            const data = await res.json();
            return data.healthy_count >= 1;
        } catch (err) {
            logError('[AudioRecorder.checkModelHealth]', err);
            return false;
        }
    }

    async function stopRecording() {
        if (!recording) {
            return;
        }

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (!uri) {
                return;
            }

            setIsTranscribing(true);

            const isHealthy = await checkModelHealth();
            if (!isHealthy) {
                Alert.alert(
                    'Modelo indisponível',
                    'O modelo de transcrição está offline. Tente novamente mais tarde.',
                );
                return;
            }

            const formData = new FormData();
            formData.append('file', {
                uri,
                name: `audio_${Date.now()}.m4a`,
                type: 'audio/mp4',
            } as any);
            formData.append('model', WHISPER_MODEL);
            formData.append('language', WHISPER_LANGUAGE);
            formData.append('response_format', 'text');

            const response = await fetch(WHISPER_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${WHISPER_TOKEN}`,
                },
                body: formData,
            });

            if (!response.ok) {
                logError('[AudioRecorder.stopRecording] Whisper API error', {status: response.status});
                return;
            }

            const data = await response.json();
            const transcribedText = (data.text || '').trim();
            if (transcribedText) {
                const separator = value.length > 0 && !value.endsWith(' ') ? ' ' : '';
                updateValue(value + separator + transcribedText);
            }

            const fileName = `audio_${Date.now()}.m4a`;
            const fileInfo: FileInfo = {
                uri,
                localPath: uri,
                name: fileName,
                extension: 'm4a',
                mime_type: 'audio/mp4',
                size: 0,
                has_preview_image: false,
                height: 0,
                width: 0,
                user_id: '',
            };
            addFiles([fileInfo]);
        } catch (err) {
            logError('[AudioRecorder.stopRecording]', err);
        } finally {
            setRecording(null);
            setIsRecording(false);
            setIsTranscribing(false);
        }
    }

    if (isTranscribing) {
        return (
            <ActivityIndicator
                size='small'
                color='#3d3c40'
                style={{padding: 10}}
            />
        );
    }

    return (
        <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={{padding: 10}}
        >
            <Animated.View style={animatedStyle}>
                <CompassIcon
                    name='microphone'
                    size={24}
                    style={{
                        color: isRecording ? 'red' : '#3d3c40',
                    }}
                />
            </Animated.View>
        </TouchableOpacity>
    );
}
