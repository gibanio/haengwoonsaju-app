import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

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

  const handlePaymentRequest = async (paymentData: any) => {};

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);

      switch (type) {
        case "REQUEST_PAYMENT":
          await handlePaymentRequest(data);
          break;
        case "SAVE_SCREEN": // 웹에서 저장 요청이 왔을 때
          startCapture(); // 캡처 시작
          break;
        case "CAPTURE_FULL_PAGE":
          await handleFullPageCapture(data);
          break;
      }
    } catch (error) {
      console.error("Message handling error:", error);
    }
  };

  const captureFullPageScript = `
(function() {
  const processNextImage = async (img) => {
    // srcset에서 가장 큰 이미지 URL 가져오기
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const srcsetItems = srcset.split(',')
        .map(item => {
          const [url, width] = item.trim().split(' ');
          return {
            url,
            width: parseInt(width?.replace('w', '') || '0')
          };
        })
        .sort((a, b) => b.width - a.width);

      if (srcsetItems.length > 0) {
        // 가장 큰 이미지 사용
        img.src = srcsetItems[0].url;
        // 원본 속성 제거
        img.removeAttribute('srcset');
        img.removeAttribute('data-nimg');
      }
    }

    // 이미지 로딩 대기
    if (!img.complete) {
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }
  };

  const waitForImages = async () => {
    const nextImages = document.querySelectorAll('img[data-nimg]');
    // Next.js 이미지 처리
    await Promise.all(Array.from(nextImages).map(processNextImage));
    
    // 일반 이미지 처리
    const allImages = document.querySelectorAll('img');
    await Promise.all(Array.from(allImages).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
  };

  const captureContent = async () => {
    const body = document.body;
    const html = document.documentElement;
    
    // 스타일 수집
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('');
        } catch (e) {
          return '';
        }
      })
      .join('');

    // 이미지를 base64로 변환
    const images = Array.from(document.images);
    await Promise.all(images.map(async (img) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        img.setAttribute('src', dataUrl);
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      } catch (e) {
        console.error('이미지 변환 실패:', e);
      }
    }));

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CAPTURE_FULL_PAGE',
      data: {
        height: Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        ),
        width: Math.max(
          body.scrollWidth,
          body.offsetWidth,
          html.clientWidth,
          html.scrollWidth,
          html.offsetWidth
        ),
        styles: styles + \`
          img {
            display: block;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 auto;
          }
          .image-container {
            position: relative !important;
            height: auto !important;
          }
        \`,
        content: document.documentElement.outerHTML
      }
    }));
  };

  // 실행
  waitForImages()
    .then(captureContent)
    .catch(error => console.error('캡처 중 오류:', error));
})();
`;

  const handleFullPageCapture = async (data: any) => {
    try {
      // PDF 생성
      const result = await Print.printToFileAsync({
        html: `
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                ${data.styles}
                body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              </style>
            </head>
            <body>
              ${data.content}
            </body>
          </html>
        `,
        width: data.width || 612,
        height: data.height || 792,
      });

      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          const fileName = `행운사주_${new Date().getTime()}.pdf`;

          // PDF 파일을 base64로 변환
          const base64Data = await FileSystem.readAsStringAsync(result.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // 선택된 디렉토리에 파일 생성
          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            "application/pdf"
          ).then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert("저장 완료", "PDF가 저장되었습니다.");
          });
        }
      } else {
        // iOS의 경우 Documents 디렉토리에 저장
        const fileName = `행운사주_${new Date().getTime()}.pdf`;
        const destinationUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.copyAsync({
          from: result.uri,
          to: destinationUri,
        });

        Alert.alert(
          "저장 완료",
          "PDF가 저장되었습니다. Files 앱에서 확인할 수 있습니다."
        );
      }
    } catch (error) {
      console.error("Full page capture error:", error);
      Alert.alert("저장 실패", "파일 저장 중 오류가 발생했습니다.");
    }
  };

  const startCapture = () => {
    webViewRef.current?.injectJavaScript(captureFullPageScript);
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
