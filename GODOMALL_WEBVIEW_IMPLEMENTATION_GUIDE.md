# 고도몰 웹뷰 연동 구현 가이드

## 개요

이 문서는 React Native 앱에서 고도몰(5hshop.com) 웹사이트를 웹뷰로 연동할 때 발생하는 결제, 새 창, 외부 앱 실행 등의 이슈를 해결하기 위한 구현 가이드입니다.

## 문제점 분석

### 1. 고도몰에서 발생하는 주요 이슈

고도몰은 전자상거래 플랫폼으로 다음과 같은 기능들이 새 창이나 외부 앱으로 처리됩니다:

1. **PG 결제 모듈**
   - 신용카드 결제 시 카드사 앱 실행 (KB카드, 신한카드, 삼성카드 등)
   - 간편결제 앱 실행 (카카오페이, 네이버페이, 토스 등)
   - 본인인증 앱 실행 (PASS, KB모바일인증 등)

2. **주소 검색**
   - 우편번호 검색 팝업
   - 다음/네이버 주소 검색 API 팝업

3. **외부 링크**
   - SNS 공유 (인스타그램, 페이스북 등)
   - 고객센터 전화 연결 (tel: URL scheme)
   - 외부 배송조회 링크

4. **약관 및 정책 팝업**
   - 이용약관, 개인정보처리방침 등의 팝업 창

## 해결 방안

### 1. WebView 설정

#### 필수 Props

```typescript
<WebView
  // 기본 설정
  javaScriptEnabled={true}
  domStorageEnabled={true}

  // 모든 프로토콜 허용 (http, https, tel, sms, intent 등)
  originWhitelist={['*']}

  // 멀티 윈도우 지원 (새 창 팝업 처리)
  setSupportMultipleWindows={true}

  // 파일 다운로드 지원
  allowFileAccess={true}

  // iOS 특정 설정
  allowsInlineMediaPlayback={true}
  mediaPlaybackRequiresUserAction={false}

  // 이벤트 핸들러
  onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
  onNavigationStateChange={handleNavigationStateChange}
  onOpenWindow={handleOpenWindow}
  onFileDownload={handleFileDownload}
/>
```

### 2. URL 스키마 처리 (onShouldStartLoadWithRequest)

이 함수는 모든 URL 요청을 가로채서 적절히 처리합니다.

```typescript
const handleShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
  const { url } = request;

  console.log('[WebView] URL Request:', url);

  // 1. HTTP/HTTPS - 웹뷰에서 계속 로드
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('about:blank')) {
    return true;
  }

  // 2. Intent URL 처리 (Android PG 결제)
  if (url.startsWith('intent://')) {
    handleIntentUrl(url);
    return false;
  }

  // 3. 앱 스키마 처리 (카드사, 간편결제 앱 등)
  if (isAppScheme(url)) {
    handleAppScheme(url);
    return false;
  }

  // 4. 전화 URL
  if (url.startsWith('tel:')) {
    Linking.openURL(url);
    return false;
  }

  // 5. SMS URL
  if (url.startsWith('sms:')) {
    Linking.openURL(url);
    return false;
  }

  // 6. 메일 URL
  if (url.startsWith('mailto:')) {
    Linking.openURL(url);
    return false;
  }

  // 기타 URL은 외부 브라우저에서 열기
  Linking.openURL(url).catch(err => {
    console.error('Failed to open URL:', err);
    Alert.alert('오류', '링크를 열 수 없습니다.');
  });

  return false;
};
```

### 3. Intent URL 처리 (Android)

Android에서 PG 결제 시 Intent URL을 앱 스키마로 변환하여 실행합니다.

```typescript
const handleIntentUrl = async (intentUrl: string) => {
  if (Platform.OS !== 'android') return;

  try {
    // Intent URL 파싱
    // intent://...#Intent;scheme=kftc-bankpay;package=...;end
    const scheme = intentUrl.match(/scheme=([^;]+)/)?.[1];
    const package_name = intentUrl.match(/package=([^;]+)/)?.[1];

    if (scheme) {
      // Intent URL을 앱 스키마로 변환
      const appSchemeUrl = intentUrl.replace('intent://', `${scheme}://`);

      try {
        // react-native-send-intent 사용 (설치 필요)
        const SendIntentAndroid = require('react-native-send-intent').default;
        const isOpened = await SendIntentAndroid.openAppWithUri(appSchemeUrl);

        if (!isOpened && package_name) {
          // 앱이 설치되지 않은 경우 Play Store로 이동
          const marketUrl = `market://details?id=${package_name}`;
          Linking.openURL(marketUrl);
        }
      } catch (e) {
        // react-native-send-intent가 없는 경우 Linking 사용
        await Linking.openURL(appSchemeUrl);
      }
    }
  } catch (error) {
    console.error('Intent URL 처리 실패:', error);
    Alert.alert('오류', '앱 실행에 실패했습니다.');
  }
};
```

### 4. 앱 스키마 처리

카드사, 간편결제 등의 앱 스키마를 처리합니다.

```typescript
// 앱 스키마 목록
const APP_SCHEMES = [
  // 은행
  'kftc-bankpay', 'ispmobile', 'hdcardappcardansimclick', 'smhyundaiansimclick',
  'shinhan-sr-ansimclick', 'kb-acp', 'mpocket.online.ansimclick',
  'lottesmartpay', 'lotteappcard', 'cloudpay', 'nhappcardansimclick',
  'citispay', 'citicardappkr', 'citimobileapp', 'kakaopay', 'kb-auth',

  // 간편결제
  'supertoss', 'kakaotalk', 'toss', 'lguthepay', 'payco', 'lpayapp',
  'wooripay', 'nhallonepayansimclick', 'hanawalletmembers',

  // 본인인증
  'smshinhanansimclick', 'pass', 'liivbank', 'kbbank',

  // 기타
  'naversearchapp', 'naversearchthirdlogin'
];

const isAppScheme = (url: string): boolean => {
  return APP_SCHEMES.some(scheme => url.startsWith(`${scheme}://`));
};

const handleAppScheme = async (url: string) => {
  try {
    if (Platform.OS === 'android') {
      // Android: react-native-send-intent 사용
      try {
        const SendIntentAndroid = require('react-native-send-intent').default;
        const isOpened = await SendIntentAndroid.openAppWithUri(url);

        if (!isOpened) {
          Alert.alert('알림', '해당 앱이 설치되어 있지 않습니다.');
        }
      } catch (e) {
        // 라이브러리가 없으면 Linking 사용
        await Linking.openURL(url);
      }
    } else {
      // iOS: Linking 직접 사용
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('알림', '해당 앱이 설치되어 있지 않습니다.');
      }
    }
  } catch (error) {
    console.error('앱 스키마 실행 실패:', error);
    Alert.alert('오류', '앱 실행에 실패했습니다.');
  }
};
```

### 5. 새 창(팝업) 처리

고도몰의 주소검색, 약관 팝업 등을 처리합니다.

```typescript
import { useState } from 'react';
import Modal from 'react-native-modal';

const [popupUrl, setPopupUrl] = useState<string | null>(null);
const [isPopupVisible, setIsPopupVisible] = useState(false);

const handleOpenWindow = (syntheticEvent: WebViewNavigation) => {
  const { nativeEvent } = syntheticEvent;
  const { targetUrl } = nativeEvent;

  console.log('[WebView] Open new window:', targetUrl);

  // 팝업으로 열기
  setPopupUrl(targetUrl);
  setIsPopupVisible(true);
};

// JSX에서 팝업 모달 추가
<Modal
  isVisible={isPopupVisible}
  onBackdropPress={() => setIsPopupVisible(false)}
  onBackButtonPress={() => setIsPopupVisible(false)}
  style={{ margin: 0 }}
>
  <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>팝업</Text>
      <TouchableOpacity onPress={() => setIsPopupVisible(false)}>
        <Text style={{ fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </View>
    {popupUrl && (
      <WebView
        source={{ uri: popupUrl }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
      />
    )}
  </SafeAreaView>
</Modal>
```

### 6. iOS 설정 (Info.plist)

iOS에서 외부 앱을 실행하려면 Info.plist에 URL 스키마를 등록해야 합니다.

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <!-- 은행 -->
  <string>kftc-bankpay</string>
  <string>ispmobile</string>
  <string>kb-acp</string>
  <string>kbbank</string>

  <!-- 카드 -->
  <string>hdcardappcardansimclick</string>
  <string>smhyundaiansimclick</string>
  <string>shinhan-sr-ansimclick</string>
  <string>mpocket.online.ansimclick</string>
  <string>lottesmartpay</string>
  <string>nhappcardansimclick</string>

  <!-- 간편결제 -->
  <string>supertoss</string>
  <string>kakaotalk</string>
  <string>kakaopay</string>
  <string>toss</string>
  <string>payco</string>
  <string>lguthepay</string>

  <!-- 본인인증 -->
  <string>pass</string>
  <string>smshinhanansimclick</string>

  <!-- 기타 -->
  <string>tel</string>
  <string>mailto</string>
</array>

<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### 7. Android 설정 (AndroidManifest.xml)

Android에서도 외부 앱 실행을 위한 쿼리 설정이 필요합니다 (Android 11+).

```xml
<manifest>
  <queries>
    <!-- 은행 -->
    <package android:name="com.kftc.bankpay.android" />
    <package android:name="kvp.jjy.MispAndroid320" />
    <package android:name="com.kbcard.kbkookmincard" />
    <package android:name="com.kbstar.kbbank" />

    <!-- 카드 -->
    <package android:name="com.hyundaicard.appcard" />
    <package android:name="kr.co.samsungcard.mpocket" />
    <package android:name="com.shcard.smartpay" />
    <package android:name="com.lotte.lottesmartpay" />
    <package android:name="com.nhcard.nhallonepay" />

    <!-- 간편결제 -->
    <package android:name="viva.republica.toss" />
    <package android:name="com.kakao.talk" />
    <package android:name="com.nhnent.payapp" />
    <package android:name="com.lguplus.paynow" />

    <!-- 본인인증 -->
    <package android:name="com.sktelecom.tauth" />

    <!-- 브라우저 intent -->
    <intent>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https" />
    </intent>
  </queries>

  <application>
    <!-- 필요 시 clearTextTraffic 허용 -->
    <application
      android:usesCleartextTraffic="true">
    </application>
  </application>
</manifest>
```

### 8. 파일 다운로드 처리

고도몰에서 주문서, 영수증 등의 파일 다운로드를 처리합니다.

```typescript
const handleFileDownload = async ({ nativeEvent }: { nativeEvent: any }) => {
  const { downloadUrl } = nativeEvent;

  try {
    // 외부 브라우저로 다운로드 URL 열기
    await Linking.openURL(downloadUrl);
  } catch (error) {
    console.error('파일 다운로드 실패:', error);
    Alert.alert('오류', '파일 다운로드에 실패했습니다.');
  }
};
```

### 9. Navigation State 변경 감지

페이지 이동을 추적하고 뒤로가기 버튼을 제어합니다.

```typescript
const [canGoBack, setCanGoBack] = useState(false);

const handleNavigationStateChange = (navState: WebViewNavigation) => {
  setCanGoBack(navState.canGoBack);

  // 특정 URL에서만 동작하도록 제한
  if (navState.url.includes('payment')) {
    console.log('결제 페이지 진입');
  }
};

// 뒤로가기 버튼 처리
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  });

  return () => backHandler.remove();
}, [canGoBack]);
```

## 필요한 패키지

### 1. 기본 패키지 (이미 설치됨)
- `react-native-webview`
- `react-native-modal` (팝업용)

### 2. 추가 설치 필요
```bash
npm install react-native-send-intent
```

Android에서 Intent URL을 처리하는 데 사용됩니다.

## 전체 구현 예시

아래는 위의 모든 기능을 통합한 완전한 예시입니다:

```typescript
// shop.tsx / mypage.tsx
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from 'react-native-modal';
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";

import { WEBVIEW_URLS } from "@/constants/WebViewUrls";
import useLayout from "@/hooks/useLayout";

export default function ShopPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const { top } = useLayout();

  // 앱 스키마 목록
  const APP_SCHEMES = [
    'kftc-bankpay', 'ispmobile', 'hdcardappcardansimclick', 'smhyundaiansimclick',
    'shinhan-sr-ansimclick', 'kb-acp', 'mpocket.online.ansimclick',
    'lottesmartpay', 'lotteappcard', 'cloudpay', 'nhappcardansimclick',
    'supertoss', 'kakaotalk', 'toss', 'lguthepay', 'payco', 'lpayapp',
    'pass', 'smshinhanansimclick', 'kbbank', 'liivbank',
  ];

  const isAppScheme = (url: string): boolean => {
    return APP_SCHEMES.some(scheme => url.startsWith(`${scheme}://`));
  };

  const handleIntentUrl = async (intentUrl: string) => {
    if (Platform.OS !== 'android') return;

    try {
      const scheme = intentUrl.match(/scheme=([^;]+)/)?.[1];
      const package_name = intentUrl.match(/package=([^;]+)/)?.[1];

      if (scheme) {
        const appSchemeUrl = intentUrl.replace('intent://', `${scheme}://`);

        try {
          const SendIntentAndroid = require('react-native-send-intent').default;
          const isOpened = await SendIntentAndroid.openAppWithUri(appSchemeUrl);

          if (!isOpened && package_name) {
            const marketUrl = `market://details?id=${package_name}`;
            Linking.openURL(marketUrl);
          }
        } catch (e) {
          await Linking.openURL(appSchemeUrl);
        }
      }
    } catch (error) {
      console.error('Intent URL 처리 실패:', error);
      Alert.alert('오류', '앱 실행에 실패했습니다.');
    }
  };

  const handleAppScheme = async (url: string) => {
    try {
      if (Platform.OS === 'android') {
        try {
          const SendIntentAndroid = require('react-native-send-intent').default;
          const isOpened = await SendIntentAndroid.openAppWithUri(url);

          if (!isOpened) {
            Alert.alert('알림', '해당 앱이 설치되어 있지 않습니다.');
          }
        } catch (e) {
          await Linking.openURL(url);
        }
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('알림', '해당 앱이 설치되어 있지 않습니다.');
        }
      }
    } catch (error) {
      console.error('앱 스키마 실행 실패:', error);
      Alert.alert('오류', '앱 실행에 실패했습니다.');
    }
  };

  const handleShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
    const { url } = request;

    console.log('[Shop] Loading URL:', url);

    // HTTP/HTTPS - 웹뷰에서 계속 로드
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('about:blank')) {
      return true;
    }

    // Intent URL 처리 (Android)
    if (url.startsWith('intent://')) {
      handleIntentUrl(url);
      return false;
    }

    // 앱 스키마 처리
    if (isAppScheme(url)) {
      handleAppScheme(url);
      return false;
    }

    // 전화, SMS, 메일
    if (url.startsWith('tel:') || url.startsWith('sms:') || url.startsWith('mailto:')) {
      Linking.openURL(url);
      return false;
    }

    // 인스타그램 등 외부 링크
    if (url.includes('instagram.com')) {
      Linking.openURL(url);
      return false;
    }

    // 기타 URL은 외부 브라우저에서 열기
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
    });

    return false;
  };

  const handleOpenWindow = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const { targetUrl } = nativeEvent;

    console.log('[Shop] Open new window:', targetUrl);

    if (targetUrl) {
      setPopupUrl(targetUrl);
      setIsPopupVisible(true);
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      console.log("Shop WebView message:", type, data);
    } catch (error) {
      console.error("Shop message handling error:", error);
    }
  };

  const handleFileDownload = async ({ nativeEvent }: { nativeEvent: any }) => {
    const { downloadUrl } = nativeEvent;

    try {
      await Linking.openURL(downloadUrl);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      Alert.alert('오류', '파일 다운로드에 실패했습니다.');
    }
  };

  // 하드웨어 뒤로가기 버튼 처리 (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

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
          requestAnimationFrame(() => {
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
          });
        }
      }, true);

      // 추가적인 안전장치로 gesturestart 방지
      document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
      });
    });
  `;

  return (
    <SafeAreaView
      style={{ flex: 1, paddingTop: Platform.OS === "ios" ? 0 : top + 4 }}
    >
      <StatusBar style="dark" />

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
        style={{ flex: 1 }}
        onLoadStart={() => {
          console.log("[Shop] Load started:", WEBVIEW_URLS.SHOP);
          setIsLoading(true);
        }}
        onLoadEnd={() => {
          console.log("[Shop] Load completed successfully");
          setIsLoading(false);
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
        javaScriptEnabled={true}
        domStorageEnabled={true}
        setSupportMultipleWindows={true}
        allowFileAccess={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        bounces={false}
        automaticallyAdjustContentInsets={false}
        injectedJavaScript={injectScript}
        scalesPageToFit={false}
        scrollEnabled={true}
        contentMode="mobile"
        originWhitelist={['*']}
      />

      {/* 팝업 모달 */}
      <Modal
        isVisible={isPopupVisible}
        onBackdropPress={() => setIsPopupVisible(false)}
        onBackButtonPress={() => setIsPopupVisible(false)}
        style={{ margin: 0 }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E5E5',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>팝업</Text>
            <TouchableOpacity onPress={() => setIsPopupVisible(false)}>
              <Text style={{ fontSize: 24, color: '#666' }}>✕</Text>
            </TouchableOpacity>
          </View>
          {popupUrl && (
            <WebView
              source={{ uri: popupUrl }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              style={{ flex: 1 }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
```

## 테스트 체크리스트

구현 후 다음 항목들을 테스트해야 합니다:

### 1. 결제 플로우
- [ ] 신용카드 결제 (카드사 앱 실행)
- [ ] 간편결제 (카카오페이, 토스 등)
- [ ] 계좌이체
- [ ] 휴대폰 결제
- [ ] 본인인증

### 2. 주소 검색
- [ ] 우편번호 검색 팝업
- [ ] 주소 입력 후 닫기

### 3. 외부 링크
- [ ] 전화 연결 (tel:)
- [ ] SMS (sms:)
- [ ] 이메일 (mailto:)
- [ ] SNS 공유 (인스타그램, 페이스북 등)

### 4. 팝업
- [ ] 이용약관 팝업
- [ ] 개인정보처리방침 팝업
- [ ] 상품 상세 이미지 팝업

### 5. 네비게이션
- [ ] 뒤로가기 버튼 (하드웨어/소프트웨어)
- [ ] 탭 전환
- [ ] 딥링크 처리

### 6. 파일 다운로드
- [ ] PDF 영수증 다운로드
- [ ] 주문서 다운로드

## 주의사항

1. **react-native-send-intent 설치**
   - Android에서 Intent URL 처리를 위해 필수
   - iOS에서는 필요 없음

2. **Info.plist 설정 (iOS)**
   - 모든 사용할 앱 스키마를 LSApplicationQueriesSchemes에 등록
   - 누락 시 해당 앱 실행 불가

3. **AndroidManifest.xml 설정 (Android 11+)**
   - queries 태그에 패키지명 등록
   - 누락 시 앱 설치 여부 확인 불가

4. **테스트**
   - 개발 중에는 실제 기기에서 테스트 (에뮬레이터/시뮬레이터에서는 앱 스키마 테스트 제한적)
   - 각 PG사별로 테스트 필요 (카드사, 간편결제사 마다 다른 스키마 사용)

5. **보안**
   - NSAllowsArbitraryLoads를 true로 설정하면 보안이 약해질 수 있음
   - 프로덕션에서는 필요한 도메인만 예외 처리 권장

## 참고 자료

1. **React Native WebView 공식 문서**
   - https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md

2. **토스페이먼츠 웹뷰 가이드**
   - https://docs.tosspayments.com/guides/v2/webview

3. **아임포트 React Native 가이드**
   - https://github.com/iamport/iamport-react-native

4. **react-native-send-intent**
   - https://github.com/lucasferreira/react-native-send-intent

## 결론

이 가이드를 따라 구현하면 고도몰 웹사이트의 결제, 새 창, 외부 앱 실행 등의 기능을 React Native 웹뷰에서 정상적으로 처리할 수 있습니다.

핵심은:
1. `onShouldStartLoadWithRequest`로 모든 URL을 가로채기
2. Intent URL을 앱 스키마로 변환
3. 앱 스키마를 플랫폼별로 처리
4. 새 창은 모달 팝업으로 처리
5. iOS/Android 설정 파일에 필요한 스키마 등록

이 가이드를 기반으로 shop.tsx와 mypage.tsx를 구현하면 됩니다.
