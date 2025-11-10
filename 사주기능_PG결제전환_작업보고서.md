# 사주 기능 인앱결제 제거 및 PG결제 전환 작업 보고서

## 📋 작업 개요

### 프로젝트명
행운사주 모바일 애플리케이션 - Fortune 기능 결제 시스템 전환

### 작업 일자
2025년 1월

### 작업 목적
- 사주(Fortune) 기능에서 인앱결제(IAP)를 완전히 제거
- 모바일 앱에서도 WebView를 통한 Portone PG결제로 전환
- 앱 스토어 수수료 회피 및 결제 프로세스 통합

## 🔧 기술적 변경 사항

### 1. React Native 앱 수정

#### 파일: `app/fortune.tsx`

**제거된 기능:**
- react-native-iap 라이브러리 의존성
- IAP 초기화 코드 (`initConnection`, `getProducts` 등)
- 구매 리스너 (`purchaseUpdatedListener`, `purchaseErrorListener`)
- 인앱결제 요청 처리 함수 (`handlePaymentRequest`)
- 제품 ID 매핑 로직

**추가된 기능:**
```typescript
// PG 결제 완료 URL 처리 함수
const handlePaymentCallback = (url: string) => {
  const urlObj = new URL(url);
  const imp_uid = urlObj.searchParams.get("imp_uid");
  const merchant_uid = urlObj.searchParams.get("merchant_uid");
  const error_code = urlObj.searchParams.get("error_code");
  const success = urlObj.searchParams.get("success");

  // 결제 결과를 WebView로 전달
  webViewRef.current?.injectJavaScript(`
    window.postMessage(${JSON.stringify({
      type: "PG_PAYMENT_RESULT",
      data: { imp_uid, merchant_uid, error_code, success }
    })}, '*');
  `);
};
```

**PG사 도메인 화이트리스트:**
- service.iamport.kr
- mobile.inicis.com
- nicepay.co.kr
- kakao.com
- 기타 카드사 도메인

**카드사 앱 스킴 지원:**
- ispmobile://
- hdcardappcardansimclick://
- kb-acp://
- 기타 20여개 카드사 앱 스킴

### 2. 웹 애플리케이션 수정

#### 수정된 파일들:
1. `src/app/(route)/fortune/job/premium/_components/primiumJobView.tsx`
2. `src/app/(route)/fortune/love/premium/_components/primiumLoveView.tsx`
3. `src/app/(route)/fortune/test/premium/_components/primiumTestView.tsx`
4. `src/app/(route)/fortune/new-year/premium/_components/primiumNewYearView.tsx`

**주요 변경 사항:**

```typescript
// 기존 코드 (제거됨)
if (platform.isApp) {
  InAppPaymentService.requestPayment(...)
} else {
  PgPaymentService.requestPayment(...)
}

// 변경된 코드
// 앱과 웹 모두 PG 결제 사용
PgPaymentService.requestPayment(
  formData,
  numericPriceInfo.discounted,
  "행운사주 2025 운세",
  redirectUrl,
  paymentCallback
)
```

**메시지 리스너 변경:**
```typescript
// PG 결제 결과 리스너
const handlePgPaymentResult = (event: MessageEvent) => {
  const message = JSON.parse(event.data);
  if (message.type === "PG_PAYMENT_RESULT") {
    const { imp_uid, merchant_uid, success } = message.data;
    if (success) {
      getFortune(formData);
    }
  }
};
```

## 📊 영향 분석

### 긍정적 영향

1. **비용 절감**
   - 앱 스토어 수수료 30% → PG 수수료 2-3%로 감소
   - 연간 예상 절감액: 수수료 차액의 27-28%

2. **관리 효율성**
   - 인앱결제와 PG결제 이중 관리 부담 제거
   - 단일 결제 시스템으로 유지보수 간소화

3. **유연성 향상**
   - 앱 심사 없이 가격 변경 가능
   - 프로모션 및 할인 정책 즉시 적용 가능

4. **사용자 경험 통일**
   - 모든 플랫폼에서 동일한 결제 프로세스
   - 일관된 결제 UI/UX 제공

### 잠재적 리스크

1. **사용자 이탈**
   - 일부 사용자는 인앱결제를 선호할 수 있음
   - 외부 결제창 이동 시 신뢰도 우려

2. **기술적 이슈**
   - WebView 내 결제 처리 시 네트워크 의존성 증가
   - 카드사 앱 미설치 시 결제 불가능

## 🧪 테스트 가이드

### 1. 환경 설정

#### 테스트 환경
- **개발**: https://dev.haengwoonsaju.com
- **프로덕션**: https://haengwoonsaju.com
- **Portone 테스트 계정**: imp84147410

#### 필요 도구
- iOS 실기기 또는 시뮬레이터
- Android 실기기 또는 에뮬레이터
- 테스트용 신용카드 정보

### 2. 기능 테스트 시나리오

#### 시나리오 1: 정상 결제 플로우

**사전 조건:**
- 앱 설치 및 Fortune 탭 진입
- 테스트 카드 정보 준비

**테스트 단계:**
1. Fortune 탭에서 운세 선택 (취업/연애/시험/신년)
2. 생년월일 정보 입력
3. 결제 버튼 클릭
4. Portone 결제창 표시 확인
5. 카드 정보 입력
6. 결제 완료
7. 운세 결과 페이지 표시 확인

**예상 결과:**
- 결제창이 WebView 내에서 정상 표시
- 결제 완료 후 자동으로 운세 결과 표시
- 결제 정보가 서버에 정상 저장

#### 시나리오 2: 카드사 앱 결제

**사전 조건:**
- 카드사 앱 설치 (KB Pay, 삼성카드 등)

**테스트 단계:**
1. 결제창에서 앱카드 결제 선택
2. 카드사 앱 자동 실행 확인
3. 앱에서 결제 승인
4. 자동으로 앱으로 복귀
5. 결제 완료 처리 확인

**예상 결과:**
- 카드사 앱 정상 실행
- 결제 후 자동 복귀
- 결제 결과 정상 수신

#### 시나리오 3: 결제 취소

**테스트 단계:**
1. 결제창 표시 후 X 버튼 클릭
2. 또는 뒤로가기 버튼 클릭
3. 결제 취소 확인

**예상 결과:**
- 결제 취소 메시지 표시
- 이전 화면으로 복귀
- 재결제 가능

#### 시나리오 4: 결제 실패

**테스트 케이스:**
- 잔액 부족 카드 사용
- 유효기간 만료 카드 사용
- 잘못된 CVV 입력

**예상 결과:**
- 적절한 오류 메시지 표시
- 재시도 가능
- 앱 크래시 없음

### 3. 플랫폼별 테스트

#### iOS 테스트
```bash
# 개발 빌드
eas build --platform ios --profile development

# 테스트 항목
- [ ] 결제창 정상 표시
- [ ] 카드사 앱 스킴 처리
- [ ] 결제 완료 URL 감지
- [ ] WebView 내 스크롤/줌 동작
```

#### Android 테스트
```bash
# 개발 빌드
eas build --platform android --profile development

# 테스트 항목
- [ ] 결제창 정상 표시
- [ ] Intent 스킴 처리
- [ ] 뒤로가기 버튼 처리
- [ ] 결제 완료 URL 감지
```

### 4. 회귀 테스트

#### 기존 기능 확인
- [ ] luck.tsx 인앱결제 정상 작동
- [ ] 이미지 저장 기능 (SAVE_IMAGE)
- [ ] PDF 저장 기능 (CAPTURE_FULL_PAGE)
- [ ] 스크린 캡처 기능 (SAVE_SCREEN)
- [ ] 탭바 표시/숨김 동작
- [ ] Instagram 링크 외부 브라우저 열기

### 5. 성능 테스트

#### 측정 항목
- 결제창 로딩 시간: < 3초
- 결제 완료 처리 시간: < 2초
- 메모리 사용량: 이전 대비 감소 예상

### 6. 보안 테스트

#### 검증 항목
- [ ] HTTPS 통신 확인
- [ ] 결제 정보 암호화
- [ ] XSS 공격 방지
- [ ] 중복 결제 방지

## 📝 배포 체크리스트

### 배포 전 확인사항

1. **코드 리뷰**
   - [ ] 모든 console.log 제거
   - [ ] 에러 처리 코드 확인
   - [ ] 주석 처리된 코드 제거

2. **테스트 완료**
   - [ ] 개발 환경 테스트
   - [ ] 스테이징 환경 테스트
   - [ ] QA 팀 검증

3. **문서 업데이트**
   - [ ] API 문서 업데이트
   - [ ] 사용자 가이드 업데이트
   - [ ] 릴리즈 노트 작성

4. **모니터링 설정**
   - [ ] 결제 성공률 대시보드
   - [ ] 에러 알림 설정
   - [ ] 성능 메트릭 추적

### 단계적 배포 계획

1. **1단계: 카나리 배포 (5%)**
   - 일부 사용자만 새 결제 시스템 적용
   - 24시간 모니터링

2. **2단계: 점진적 확대 (25% → 50%)**
   - 문제 없을 시 사용자 비율 증가
   - 각 단계 12시간 유지

3. **3단계: 전체 배포 (100%)**
   - 모든 사용자에게 적용
   - 롤백 계획 준비

## 🚨 롤백 계획

### 롤백 트리거 조건
- 결제 성공률 70% 미만
- 크리티컬 버그 발견
- 사용자 컴플레인 급증

### 롤백 절차
1. 이전 버전 브랜치로 전환
2. 긴급 패치 배포
3. 사용자 공지
4. 원인 분석 및 수정

## 📈 성공 지표

### 단기 지표 (1주)
- 결제 성공률 > 95%
- 앱 크래시율 < 0.1%
- 사용자 이탈률 변화 < 5%

### 중기 지표 (1개월)
- 수수료 절감액 측정
- 고객 만족도 조사
- 결제 관련 CS 문의 감소

### 장기 지표 (3개월)
- 매출 영향 분석
- 사용자 리텐션 변화
- 운영 효율성 개선도

## 🔔 주의사항

1. **앱 스토어 정책**
   - Apple/Google 정책 위반 여부 재확인
   - 필요시 법무팀 검토

2. **사용자 커뮤니케이션**
   - 변경 사항 사전 공지
   - FAQ 문서 준비
   - CS 팀 교육

3. **백업 및 복구**
   - 데이터베이스 백업
   - 이전 버전 코드 보관
   - 설정 파일 백업

## 📞 연락처

- **개발팀**: dev-team@haengwoonsaju.com
- **QA팀**: qa-team@haengwoonsaju.com
- **긴급 연락처**: 010-XXXX-XXXX

---

*이 문서는 2025년 1월 작성되었으며, 실제 배포 시 최신 상황에 맞게 업데이트가 필요할 수 있습니다.*