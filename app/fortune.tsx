import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Linking, Platform, SafeAreaView, View } from "react-native";
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";

import { WEBVIEW_URLS } from "@/constants/WebViewUrls";
import useLayout from "@/hooks/useLayout";

export default function FortunePage() {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const { top } = useLayout();

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);

      switch (type) {
        // 필요시 사주풀이 전용 메시지 핸들링 추가
        default:
          console.log("Fortune WebView message:", type, data);
      }
    } catch (error) {
      console.error("Fortune message handling error:", error);
    }
  };

  const handleShouldStartLoadWithRequest = (
    request: WebViewNavigation
  ): boolean => {
    // 인스타그램 링크만 외부 브라우저로 열기
    if (request.url.includes("instagram.com")) {
      Linking.openURL(request.url);
      return false; // WebView 로딩 중지
    }
    return true; // 인스타그램 외의 모든 URL은 웹뷰에서 계속 로드
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
      true;
    });
  });
  `;

  return (
    <SafeAreaView
      style={{ flex: 1, paddingTop: Platform.OS === "ios" ? 0 : top + 4 }}
    >
      <StatusBar style="dark" />

      {/* 상단 섹션 */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          backgroundColor: "#F5F5F5",
        }}
      />

      {/* 하단 섹션 */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          backgroundColor: "#FFFFFF",
        }}
      />

      <WebView
        ref={webViewRef}
        source={{ uri: WEBVIEW_URLS.FORTUNE }}
        style={{
          flex: 1,
        }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
        }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        bounces={false}
        automaticallyAdjustContentInsets={false}
        injectedJavaScript={injectScript}
        scalesPageToFit={false}
        scrollEnabled={true}
        contentMode="mobile"
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
      />
    </SafeAreaView>
  );
}
