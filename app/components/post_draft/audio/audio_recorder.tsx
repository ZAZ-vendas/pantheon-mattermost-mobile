import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import CompassIcon from '@components/compass_icon';

type Props = {
    onUpload: (files: any[]) => void;
};

export default function AudioRecorder({ onUpload }: Props) {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            opacity.setValue(1);
        }
    }, [isRecording]);

    async function startRecording() {
        try {
            if (recording) return;

            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } =
                await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );

            setRecording(newRecording);
            setIsRecording(true);
        } catch (err) {
            console.log('Erro ao iniciar gravação', err);
        }
    }

    async function stopRecording() {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (!uri) return;

            const info = await FileSystem.getInfoAsync(uri);
            const now = Date.now();

            const audioFile = {
                name: `audio_${now}.m4a`,
                extension: 'm4a',
                size: info.exists ? (info.size ?? 0) : 0,
                mime_type: 'audio/mp4',
                type: 'audio/mp4',
                localPath: uri,
                uri,
                path: uri,
            };

            onUpload([audioFile]);
        } catch (err) {
            console.log('Erro ao parar gravação', err);
        } finally {
            setRecording(null);
            setIsRecording(false);
        }
    }

    return (
        <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={{ padding: 10 }}
        >
            <Animated.View style={{ opacity }}>
                <CompassIcon
                    name="microphone"
                    size={24}
                    style={{
                        color: isRecording ? 'red' : '#3d3c40',
                    }}
                />
            </Animated.View>
        </TouchableOpacity>
    );
}
