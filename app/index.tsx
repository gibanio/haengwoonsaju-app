import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  View,
} from "react-native";
import RNIap, {
  finishTransaction,
  getProducts,
  initConnection,
  ProductPurchase,
  Purchase,
  PurchaseError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  Subscription,
} from "react-native-iap";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import Config from "@/constants/Config";
import { ProductItem } from "@/constants/Product";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const formDataRef = useRef<any>(null);

  useEffect(() => {
    initializeIAP();
    /* RNStatusBar.setBarStyle("dark-content", true);
    RNStatusBar.setBackgroundColor("#F5F5F5", true); */
    // IAP 리스너 설정
    const purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: ProductPurchase) => {
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            // 구매 완료 처리
            await finishTransaction({
              purchase,
              isConsumable: true,
            });

            const message = JSON.stringify({
              type: "PAYMENT_RESULT",
              data: {
                success: true,
                formData: formDataRef.current,
                productId: purchase.productId,
                receipt: receipt,
                platform: Platform.OS,
              },
            });

            webViewRef.current?.injectJavaScript(
              `window.postMessage('${message}', '*'); 
              true;`
            );
            formDataRef.current = null;
          } catch (err) {
            console.warn("구매 완료 처리 실패:", err);
            handlePurchaseError();
          }
        } else {
          console.log("test3");
        }
      }
    );

    const purchaseErrorSubscription = purchaseErrorListener((error: any) => {
      console.warn("구매 오류:", error);
      handlePurchaseError();
    });

    // 클린업 함수
    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      hideSplash();
    }
  }, [isLoading]);

  const hideSplash = async () => {
    SplashScreen.hideAsync();
  };

  const initializeIAP = async () => {
    try {
      const temp = await initConnection();

      console.log("IAP 초기화 성공:", temp);
      if (Platform.OS === "android") {
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
      }

      const products = await getProducts({ skus: ProductItem });
      console.log("Available products:", products);
    } catch (err) {
      console.warn("IAP 초기화 실패:", err);
    }
  };

  const handlePurchaseError = useCallback((error?: PurchaseError) => {
    console.warn("Purchase error:", error);
    webViewRef.current?.injectJavaScript(`
      window.postMessage(
        JSON.stringify({
          type: 'PURCHASE_FAILED',
          data: { error: 'Purchase failed' }
        })
      );
    `);
    formDataRef.current = null;
  }, []);

  // handlePaymentRequest 함수 구현
  const handlePaymentRequest = async (data: any) => {
    try {
      const { type, formData } = data;
      let productId: string;
      console.log(type);
      switch (type) {
        case "NewyearFortune":
          productId = ProductItem[0]; // "NewyearFortune"
          break;
        case "WorkFortune":
          productId = ProductItem[1]; // "WorkFortune"
          break;
        case "ExamFortune":
          productId = ProductItem[2]; // "ExamFortune"
          break;
        case "LoveFortune":
          productId = ProductItem[3]; // "LoveFortune"
          break;
        case "MatchPremium":
          productId = ProductItem[4]; // "MatchPremium"
          break;
        default:
          throw new Error("Invalid product type");
      }
      formDataRef.current = formData;
      await requestPurchase({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
      console.log("productId", productId);
    } catch (error) {
      console.error("Purchase error:", error);
      // 요청 자체가 실패한 경우에만 에러 메시지 전송
      webViewRef.current?.injectJavaScript(`
      window.postMessage(
        JSON.stringify({
          type: 'PURCHASE_ERROR',
          data: { error: 'Purchase request failed' }
        })
      );
    `);
      throw error;
    }
  };

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
    <SafeAreaView style={{ flex: 1 }}>
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
        source={{ uri: Config.API_HOST }}
        style={{
          flex: 1,
        }}
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
