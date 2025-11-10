import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";

import { WEBVIEW_URLS } from "@/constants/WebViewUrls";
import useLayout from "@/hooks/useLayout";

export default function LuckPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState<string>(WEBVIEW_URLS.LUCK);
  const webViewRef = useRef<WebView>(null);
  const navigation = useNavigation();

  const { top } = useLayout();

  useEffect(() => {
    if (!isLoading) {
      hideSplash();
    }
  }, [isLoading]);

  const hideSplash = async () => {
    SplashScreen.hideAsync();
  };

  // 탭바 재클릭 시 메인 페이지로 이동 또는 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress" as any, (e) => {
      console.log("[Luck] Tab pressed, current URL:", currentUrl);

      if (webViewRef.current) {
        if (currentUrl !== WEBVIEW_URLS.LUCK) {
          // 하위 페이지인 경우 메인으로 이동
          console.log("[Luck] Redirecting to main page");
          webViewRef.current.injectJavaScript(`
            window.location.href = '${WEBVIEW_URLS.LUCK}';
            true;
          `);
        } else {
          // 메인 페이지인 경우 새로고침
          console.log("[Luck] Refreshing main page");
          webViewRef.current.reload();
        }
      }
    });

    return unsubscribe;
  }, [navigation, currentUrl]);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);

      switch (type) {
        case "SAVE_SCREEN": // 웹에서 저장 요청이 왔을 때
          startCapture(); // 캡처 시작
          break;
        case "SAVE_IMAGE":
          await handleImageSave(data);
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
        img.src = srcsetItems[0].url;
        img.removeAttribute('srcset');
        img.removeAttribute('data-nimg');
      }
    }

    if (!img.complete) {
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }
  };

  const waitForImages = async () => {
    const nextImages = document.querySelectorAll('img[data-nimg]');
    await Promise.all(Array.from(nextImages).map(processNextImage));
    
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
    const element = document.body;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // 캔버스 크기 설정
    canvas.width = element.scrollWidth;
    canvas.height = element.scrollHeight;

    // html2canvas 사용
    const html2canvas = window.html2canvas;
    const renderedCanvas = await html2canvas(element, {
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: true,
    });

    const imageData = renderedCanvas.toDataURL('image/png', 1.0);

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SAVE_IMAGE',
      data: {
        imageData: imageData,
        filename: \`행운사주_\${new Date().getTime()}.png\`
      }
    }));
  };

  waitForImages()
    .then(captureContent)
    .catch(error => console.error('캡처 중 오류:', error));
})();
`;

  const handleImageSave = async (data: {
    imageData: string;
    filename: string;
  }) => {
    try {
      // 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
        return;
      }

      // base64 데이터에서 헤더 제거
      const base64Data = data.imageData.replace(/^data:image\/\w+;base64,/, "");

      // 임시 파일 생성
      const tempUri = FileSystem.documentDirectory + data.filename;
      await FileSystem.writeAsStringAsync(tempUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 갤러리에 저장
      const asset = await MediaLibrary.createAssetAsync(tempUri);
      await MediaLibrary.createAlbumAsync("행운사주", asset, false);

      // 임시 파일 삭제
      await FileSystem.deleteAsync(tempUri);

      Alert.alert("저장 완료", "이미지가 갤러리에 저장되었습니다.");
    } catch (error) {
      console.error("Image save error:", error);
      Alert.alert("저장 실패", "이미지 저장 중 오류가 발생했습니다.");
    }
  };

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

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const newUrl = navState.url;
    setCurrentUrl(newUrl);
    console.log("[Luck] Current URL:", newUrl);

    // fortune 관련 URL로 이동하려는 경우 사주풀이 탭으로 전환
    if (newUrl.includes("/fortune")) {
      console.log("[Luck] Detected fortune URL, navigating to fortune tab with URL:", newUrl);
      navigation.navigate("fortune" as never, { targetUrl: newUrl } as never);

      // 웹뷰가 실제로 fortune URL을 로드하지 않도록 행운 탭 메인으로 되돌림
      setTimeout(() => {
        if (webViewRef.current && currentUrl !== WEBVIEW_URLS.LUCK) {
          webViewRef.current.injectJavaScript(`
            window.location.href = '${WEBVIEW_URLS.LUCK}';
            true;
          `);
        }
      }, 100);
      return;
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
        source={{ uri: WEBVIEW_URLS.LUCK }}
        style={{
          flex: 1,
        }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
          //webview에 메시지 전달
          webViewRef.current?.injectJavaScript(`
      window.postMessage(
        JSON.stringify({
          type: 'HIDE_BANNER',
        })
      );
    `);
        }}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
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
