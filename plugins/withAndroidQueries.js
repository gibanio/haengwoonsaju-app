const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to add Android queries for payment apps
 * This allows the app to check if payment apps are installed and launch them
 */
const withAndroidQueries = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest;

    // queries 태그가 없으면 추가
    if (!mainApplication.queries) {
      mainApplication.queries = [];
    }

    const queries = mainApplication.queries[0] || {};

    // package 배열 초기화
    if (!queries.package) {
      queries.package = [];
    }

    // intent 배열 초기화
    if (!queries.intent) {
      queries.intent = [];
    }

    // 결제 관련 앱 패키지 목록
    const paymentPackages = [
      // 은행
      { $: { 'android:name': 'com.kftc.bankpay.android' } }, // 뱅크페이
      { $: { 'android:name': 'kvp.jjy.MispAndroid320' } }, // ISP/페이북
      { $: { 'android:name': 'com.kbcard.kbkookmincard' } }, // KB카드
      { $: { 'android:name': 'com.kbstar.kbbank' } }, // KB국민은행

      // 카드사
      { $: { 'android:name': 'com.hyundaicard.appcard' } }, // 현대카드
      { $: { 'android:name': 'kr.co.samsungcard.mpocket' } }, // 삼성카드
      { $: { 'android:name': 'com.shcard.smartpay' } }, // 신한카드
      { $: { 'android:name': 'com.lotte.lottesmartpay' } }, // 롯데카드
      { $: { 'android:name': 'com.nhcard.nhallonepay' } }, // NH농협카드
      { $: { 'android:name': 'com.hanaskcard.paycla' } }, // 하나카드
      { $: { 'android:name': 'com.wooricard.smartapp' } }, // 우리카드

      // 간편결제
      { $: { 'android:name': 'viva.republica.toss' } }, // 토스
      { $: { 'android:name': 'com.kakao.talk' } }, // 카카오톡
      { $: { 'android:name': 'com.nhnent.payapp' } }, // 페이코
      { $: { 'android:name': 'com.lguplus.paynow' } }, // LG유플러스 페이나우
      { $: { 'android:name': 'com.samsung.android.spay' } }, // 삼성페이
      { $: { 'android:name': 'com.ssg.serviceapp.android.egiftcertificate' } }, // SSG페이

      // 본인인증
      { $: { 'android:name': 'com.sktelecom.tauth' } }, // PASS (SKT)
      { $: { 'android:name': 'com.kt.ktauth' } }, // PASS (KT)
      { $: { 'android:name': 'com.lguplus.smartotp' } }, // PASS (LGU+)
    ];

    // 기존 패키지와 중복되지 않도록 추가
    paymentPackages.forEach((pkg) => {
      const exists = queries.package.some(
        (existingPkg) => existingPkg.$['android:name'] === pkg.$['android:name']
      );
      if (!exists) {
        queries.package.push(pkg);
      }
    });

    // HTTPS intent 추가 (웹 결제 페이지용)
    const httpsIntent = {
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [{ $: { 'android:name': 'android.intent.category.BROWSABLE' } }],
      data: [{ $: { 'android:scheme': 'https' } }],
    };

    // 기존에 없으면 추가
    const intentExists = queries.intent.some((intent) => {
      return intent.data && intent.data[0] && intent.data[0].$ && intent.data[0].$['android:scheme'] === 'https';
    });

    if (!intentExists) {
      queries.intent.push(httpsIntent);
    }

    mainApplication.queries[0] = queries;

    return config;
  });
};

module.exports = withAndroidQueries;
