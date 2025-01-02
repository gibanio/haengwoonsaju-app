import * as MediaLibrary from "expo-media-library";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from "react-native";
import { captureScreen } from "react-native-view-shot";
import { WebView } from "react-native-webview";

import Config from "@/constants/Config";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    RNStatusBar.setBarStyle("dark-content", true);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      hideSplash();
    }
  }, [isLoading]);

  const hideSplash = async () => {
    SplashScreen.hideAsync();
  };

  const handleMessage = async (event: any) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);

      switch (type) {
        case "SAVE_SCREEN":
          await handleScreenCapture();
          break;
        default:
          console.log("Unknown message type:", type);
      }
    } catch (error: any) {
      console.error("Message handling error:", error);
    }
  };

  const handleScreenCapture = async () => {
    try {
      if (Platform.OS === "android") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("권한 필요", "저장하기 위해 권한이 필요합니다.");
          return;
        }
      }

      const uri = await captureScreen({
        format: "jpg",
        quality: 0.8,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("행운사주", asset, false);

      Alert.alert("저장 완료", "이미지가 갤러리에 저장되었습니다.");
    } catch (error) {
      console.error("Screen capture error:", error);
      Alert.alert("저장 실패", "화면을 저장하는 중 오류가 발생했습니다.");
    }
  };

  const injectScript = `
    window.addEventListener('load', function() {
    // 기본 viewport 설정
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);

    // input focus 시점에 바로 처리
    document.addEventListener('focus', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        // 즉시 scale 체크 및 재설정
        requestAnimationFrame(() => {
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        });
      }
    }, true);

    // 추가적인 안전장치로 gesturestart 방지
    document.addEventListener('gesturestart', function(e) {
      e.preventDefault();
  
      // 캡처 함수 추가
      window.captureScreen = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SAVE_SCREEN',
          data: {}
        }));
      };
  
      true;
    });
  `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <ExpoStatusBar style="dark" />
      <WebView
        ref={webViewRef}
        source={{ uri: Config.API_HOST }}
        style={{ flex: 1 }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        bounces={false}
        automaticallyAdjustContentInsets={false}
        injectedJavaScript={injectScript}
        scalesPageToFit={false}
        scrollEnabled={true}
        contentMode="mobile"
      />
    </SafeAreaView>
  );
}
