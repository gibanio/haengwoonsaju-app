import * as SplashScreen from "expo-splash-screen";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from "react-native";
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
        case "REQUEST_PAYMENT":
          await handlePaymentRequest(data);
          break;

        default:
          console.log("Unknown message type:", type);
      }
    } catch (error: any) {
      console.error("Message handling error:", error);
      sendPaymentResultToWeb({
        success: false,
        error: error.message,
      });
    }
  };

  const handlePaymentRequest = async (paymentData: any) => {
    try {
      // 1. 결제창 표시 전 작업
      Alert.alert(
        "결제 안내",
        `결제금액: ${paymentData.amount}원\n상품: ${paymentData.productName}`,
        [
          {
            text: "취소",
            onPress: () =>
              sendPaymentResultToWeb({
                success: false,
                error: "USER_CANCEL",
              }),
            style: "cancel",
          },
          {
            text: "결제하기",
            onPress: async () => {
              // 2. 실제 결제 처리 (예: PG사 SDK 호출)
              try {
                // 여기에서 실제 결제 프로세스 구현
                // const paymentResult = await PaymentSDK.process(paymentData);

                // 3. 결제 성공 시 웹앱으로 결과 전송
                sendPaymentResultToWeb({
                  success: true,
                  transactionId: "dummy-tx-id", // 실제 결제 후 생성되는 거래 ID
                  paidAmount: paymentData.amount,
                  formData: paymentData.formData,
                });
              } catch (error: any) {
                // 4. 결제 실패 시 에러 전송
                sendPaymentResultToWeb({
                  success: false,
                  error: error.message,
                });
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Payment processing error:", error);
      sendPaymentResultToWeb({
        success: false,
        error: error.message,
      });
    }
  };

  const sendPaymentResultToWeb = (result: any) => {
    const message = JSON.stringify({
      type: "PAYMENT_RESULT",
      data: result,
    });

    webViewRef.current?.injectJavaScript(`
      window.postMessage('${message}', '*');
      true;
    `);
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
    });

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
