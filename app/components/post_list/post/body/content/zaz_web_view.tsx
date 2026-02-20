import React, {useState, useRef} from 'react';
import {Modal, Text, TouchableOpacity, View, StyleSheet, SafeAreaView} from 'react-native';
import {WebView} from 'react-native-webview';
import CompassIcon from '@components/compass_icon'; 

interface Props {
    url: string;
    theme: Theme;
}

const ZazWebView = ({url, theme}: Props) => {
    const [visible, setVisible] = useState(false);
    const [currentUrl, setCurrentUrl] = useState(url); // Estado para a URL atual
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const webViewRef = useRef<WebView>(null);

    const onNavigationStateChange = (navState: any) => {
        setCanGoBack(navState.canGoBack);
        setCanGoForward(navState.canGoForward);
        setCurrentUrl(navState.url); // Atualiza a URL exibida conforme navega
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                onPress={() => setVisible(true)}
                style={[styles.button, {backgroundColor: theme.buttonBg}]}
            >
                <Text style={{color: theme.buttonColor, fontWeight: 'bold'}}>Abrir Relatório ZAZ</Text>
            </TouchableOpacity>

            <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
                <SafeAreaView style={{flex: 1, backgroundColor: theme.centerChannelBg}}>
                    {/* Barra de Navegação Superior com URL */}
                    <View style={[styles.header, {borderBottomColor: theme.centerChannelColor + '20'}]}>
                        <View style={styles.navGroup}>
                            <TouchableOpacity 
                                onPress={() => webViewRef.current?.goBack()}
                                disabled={!canGoBack}
                                style={{opacity: canGoBack ? 1 : 0.3}}
                            >
                                <CompassIcon name="chevron-left" size={28} color={theme.centerChannelColor}/>
                            </TouchableOpacity>
                            
                            {/* Exibição da URL (Encurtada para não quebrar o layout) */}
                            <View style={[styles.urlBar, {backgroundColor: theme.centerChannelColor + '10'}]}>
                                <Text 
                                    numberOfLines={1} 
                                    style={{color: theme.centerChannelColor, fontSize: 12, opacity: 0.7}}
                                >
                                    {currentUrl}
                                </Text>
                            </View>

                            <TouchableOpacity 
                                onPress={() => webViewRef.current?.goForward()}
                                disabled={!canGoForward}
                                style={{opacity: canGoForward ? 1 : 0.3}}
                            >
                                <CompassIcon name="chevron-right" size={28} color={theme.centerChannelColor}/>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                            <CompassIcon name="close" size={24} color={theme.errorTextColor}/>
                        </TouchableOpacity>
                    </View>

                    <WebView 
                        ref={webViewRef}
                        source={{uri: url}} 
                        style={{flex: 1}}
                        onNavigationStateChange={onNavigationStateChange}
                        startInLoadingState={true}
                        domStorageEnabled={true}
                        javaScriptEnabled={true}
                    />
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginTop: 8, marginBottom: 8 },
    button: { padding: 12, borderRadius: 8, alignItems: 'center' },
    header: { 
        height: 60, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 10, 
        borderBottomWidth: 1 
    },
    navGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    urlBar: {
        flex: 1,
        marginHorizontal: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        justifyContent: 'center'
    },
    closeButton: { paddingLeft: 10 }
});

export default ZazWebView;