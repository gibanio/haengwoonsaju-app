/**
 * WebView URL 상수 정의
 * 각 탭에서 사용할 웹뷰 URL을 중앙에서 관리
 */

export const WEBVIEW_URLS = {
  // 행운 탭 - 메인 운세 서비스 (인앱구매, 이미지/PDF 저장 기능 포함)
  LUCK: "https://dev.haengwoonsaju.com/luck",

  // 사주풀이 탭 - 사주 관련 콘텐츠
  FORTUNE: "https://dev.haengwoonsaju.com/fortune",

  // 오행샵 탭 - 외부 쇼핑몰 연동
  SHOP: "https://5hshop.com/",

  // 마이 탭 - 쇼핑몰 마이페이지
  MYPAGE: "https://5hshop.com/mypage/index.php",
} as const;

// URL 타입 정의
export type WebViewUrl = (typeof WEBVIEW_URLS)[keyof typeof WEBVIEW_URLS];
