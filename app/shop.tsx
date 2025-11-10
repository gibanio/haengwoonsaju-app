import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Linking,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";

import { WEBVIEW_URLS } from "@/constants/WebViewUrls";
import useLayout from "@/hooks/useLayout";

export default function ShopPage() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [shouldShowTabBar, setShouldShowTabBar] = useState(true);
  const [currentUrl, setCurrentUrl] = useState<string>(WEBVIEW_URLS.SHOP);
  const webViewRef = useRef<WebView>(null);
  const navigation = useNavigation();

  const { top } = useLayout();

  // 탭바를 숨겨야 하는 경로 체크 함수
  const shouldHideTabBar = (url: string): boolean => {
    // 상품상세: /goods/goods_view.php?goodsNo=
    // 장바구니: /order/cart.php
    // 주문서작성: /order/order.php?cartIdx=
    // 주문완료: /order/order_end.php?orderNo=
    return (
      url.includes("/goods/goods_view.php") ||
      url.includes("/order/cart.php") ||
      url.includes("/order/order.php") ||
      url.includes("/order/order_end.php")
    );
  };

  // 탭바 재클릭 시 메인 페이지로 이동
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress" as any, (e) => {
      console.log("[Shop] Tab pressed, current URL:", currentUrl);

      // 메인 페이지가 아닌 경우에만 메인으로 이동
      if (currentUrl !== WEBVIEW_URLS.SHOP && webViewRef.current) {
        console.log("[Shop] Redirecting to main page");
        webViewRef.current.injectJavaScript(`
          window.location.href = '${WEBVIEW_URLS.SHOP}';
          true;
        `);
      }
    });

    return unsubscribe;
  }, [navigation, currentUrl]);

  // 탭바 표시/숨김 제어
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: shouldShowTabBar
        ? {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E5E7EB",
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 92 : 72,
            paddingBottom: Platform.OS === "ios" ? 24 : 12,
            paddingTop: 8,
          }
        : { display: "none" },
    });
  }, [shouldShowTabBar, navigation]);

  // 앱 스키마 목록 (결제, 간편결제, 본인인증 등)
  const APP_SCHEMES = [
    "kftc-bankpay",
    "ispmobile",
    "hdcardappcardansimclick",
    "smhyundaiansimclick",
    "shinhan-sr-ansimclick",
    "kb-acp",
    "kbbank",
    "mpocket.online.ansimclick",
    "lottesmartpay",
    "lotteappcard",
    "cloudpay",
    "nhappcardansimclick",
    "citispay",
    "citicardappkr",
    "citimobileapp",
    "supertoss",
    "kakaotalk",
    "kakaopay",
    "toss",
    "payco",
    "lguthepay",
    "lpayapp",
    "wooripay",
    "nhallonepayansimclick",
    "hanawalletmembers",
    "pass",
    "smshinhanansimclick",
    "liivbank",
    "naversearchapp",
    "naversearchthirdlogin",
  ];

  const isAppScheme = (url: string): boolean => {
    return APP_SCHEMES.some((scheme) => url.startsWith(`${scheme}://`));
  };

  const handleIntentUrl = async (intentUrl: string) => {
    if (Platform.OS !== "android") return;

    try {
      // Intent URL 파싱
      // intent://...#Intent;scheme=kftc-bankpay;package=...;end
      const scheme = intentUrl.match(/scheme=([^;]+)/)?.[1];
      const packageName = intentUrl.match(/package=([^;]+)/)?.[1];

      if (scheme) {
        // Intent URL을 앱 스키마로 변환
        const appSchemeUrl = intentUrl.replace("intent://", `${scheme}://`);

        try {
          const canOpen = await Linking.canOpenURL(appSchemeUrl);
          if (canOpen) {
            await Linking.openURL(appSchemeUrl);
          } else if (packageName) {
            // 앱이 설치되지 않은 경우 Play Store로 이동
            const marketUrl = `market://details?id=${packageName}`;
            await Linking.openURL(marketUrl);
          } else {
            Alert.alert("알림", "해당 앱이 설치되어 있지 않습니다.");
          }
        } catch (e) {
          console.error("Intent URL 실행 실패:", e);
          Alert.alert("오류", "앱 실행에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Intent URL 처리 실패:", error);
      Alert.alert("오류", "앱 실행에 실패했습니다.");
    }
  };

  const handleAppScheme = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("알림", "해당 앱이 설치되어 있지 않습니다.");
      }
    } catch (error) {
      console.error("앱 스키마 실행 실패:", error);
      Alert.alert("오류", "앱 실행에 실패했습니다.");
    }
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);

      switch (type) {
        // 필요시 오행샵 전용 메시지 핸들링 추가
        default:
          console.log("Shop WebView message:", type, data);
      }
    } catch (error) {
      console.error("Shop message handling error:", error);
    }
  };

  const handleShouldStartLoadWithRequest = (
    request: WebViewNavigation
  ): boolean => {
    const { url } = request;

    console.log("[Shop] Loading URL:", url);

    // HTTP/HTTPS - 웹뷰에서 계속 로드
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("about:blank")
    ) {
      return true;
    }

    // Intent URL 처리 (Android PG 결제)
    if (url.startsWith("intent://")) {
      handleIntentUrl(url);
      return false;
    }

    // 앱 스키마 처리 (카드사, 간편결제 앱 등)
    if (isAppScheme(url)) {
      handleAppScheme(url);
      return false;
    }

    // 전화, SMS, 메일
    if (
      url.startsWith("tel:") ||
      url.startsWith("sms:") ||
      url.startsWith("mailto:")
    ) {
      Linking.openURL(url);
      return false;
    }

    // 인스타그램 등 SNS 링크
    if (
      url.includes("instagram.com") ||
      url.includes("facebook.com") ||
      url.includes("twitter.com")
    ) {
      Linking.openURL(url);
      return false;
    }

    // 기타 외부 URL은 외부 브라우저에서 열기
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
    });

    return false;
  };

  const handleOpenWindow = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const targetUrl = nativeEvent.targetUrl;

    console.log("[Shop] Open new window:", targetUrl);

    if (targetUrl) {
      setPopupUrl(targetUrl);
      setIsPopupVisible(true);
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);

    const newUrl = navState.url;
    setCurrentUrl(newUrl);
    console.log("[Shop] Current URL:", newUrl);

    // 특정 경로에서만 탭바 숨김
    const hideTabBar = shouldHideTabBar(newUrl);
    console.log("[Shop] Should hide tab bar:", hideTabBar);
    setShouldShowTabBar(!hideTabBar);
  };

  const handleFileDownload = async ({ nativeEvent }: { nativeEvent: any }) => {
    const { downloadUrl } = nativeEvent;

    try {
      await Linking.openURL(downloadUrl);
    } catch (error) {
      console.error("파일 다운로드 실패:", error);
      Alert.alert("오류", "파일 다운로드에 실패했습니다.");
    }
  };

  // 하드웨어 뒤로가기 버튼 처리 (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [canGoBack]);

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
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* 상단 섹션 */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          backgroundColor: "#FFFFFF",
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
        source={{ uri: WEBVIEW_URLS.SHOP }}
        style={{
          flex: 1,
        }}
        onLoadStart={() => {
          console.log("[Shop] Load started:", WEBVIEW_URLS.SHOP);
        }}
        onLoadEnd={() => {
          console.log("[Shop] Load completed successfully");
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("[Shop] WebView Error:", nativeEvent);
          Alert.alert(
            "로딩 오류",
            `URL: ${nativeEvent.url}\n오류: ${nativeEvent.description}`
          );
        }}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onOpenWindow={handleOpenWindow}
        onFileDownload={handleFileDownload}
        onRenderProcessGone={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("[Shop] WebView Crashed:", nativeEvent);
          // WebView 크래시 시 자동 복구
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        setSupportMultipleWindows={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        bounces={false}
        automaticallyAdjustContentInsets={false}
        injectedJavaScript={injectScript}
        scalesPageToFit={false}
        scrollEnabled={true}
        contentMode="mobile"
        originWhitelist={["*"]}
      />

      {/* 팝업 모달 */}
      <Modal
        visible={isPopupVisible}
        animationType="slide"
        onRequestClose={() => setIsPopupVisible(false)}
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              paddingTop: Platform.OS === "ios" ? 60 : 50,
              borderBottomWidth: 1,
              borderBottomColor: "#E5E5E5",
              backgroundColor: "white",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>팝업</Text>
            <TouchableOpacity
              onPress={() => setIsPopupVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 24, color: "#666" }}>✕</Text>
            </TouchableOpacity>
          </View>
          {popupUrl && (
            <WebView
              source={{ uri: popupUrl }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={["*"]}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
