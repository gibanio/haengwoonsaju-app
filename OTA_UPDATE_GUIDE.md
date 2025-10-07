# Expo OTA (Over-The-Air) 업데이트 가이드

## 목차
1. [OTA 업데이트란?](#ota-업데이트란)
2. [EAS Update 설정](#eas-update-설정)
3. [업데이트 배포 방법](#업데이트-배포-방법)
4. [업데이트 가능한 변경사항](#업데이트-가능한-변경사항)
5. [채널 및 브랜치 전략](#채널-및-브랜치-전략)
6. [롤백 및 버전 관리](#롤백-및-버전-관리)
7. [모니터링 및 분석](#모니터링-및-분석)
8. [주의사항 및 제한사항](#주의사항-및-제한사항)

---

## OTA 업데이트란?

**OTA (Over-The-Air) 업데이트**는 앱스토어 심사 없이 JavaScript 코드와 에셋을 실시간으로 업데이트하는 기술입니다.

### 장점

✅ **즉각적인 배포**: 몇 분 안에 사용자에게 업데이트 전달
✅ **스토어 심사 불필요**: 2-7일 소요되는 심사 과정 생략
✅ **빠른 버그 수정**: 긴급 버그를 즉시 수정 가능
✅ **A/B 테스팅**: 다양한 버전을 테스트 가능
✅ **무료**: Expo의 무료 플랜에서도 사용 가능

### 제한사항

❌ **네이티브 코드 변경 불가**: Java/Kotlin/Objective-C/Swift 수정 시 새 빌드 필요
❌ **네이티브 모듈 추가 불가**: 새로운 네이티브 라이브러리 설치 시 새 빌드 필요
❌ **앱 권한 변경 불가**: `app.json`의 권한 설정 변경 시 새 빌드 필요
❌ **스토어 정책 준수**: Apple/Google 정책을 위반하면 앱이 삭제될 수 있음

---

## EAS Update 설정

### 1단계: EAS Update 설치

```bash
# EAS CLI가 이미 설치되어 있다면 스킵
npm install -g eas-cli

# 프로젝트에 expo-updates 설치
npx expo install expo-updates
```

### 2단계: app.json 설정

[app.json](app.json)에 다음 설정 추가:

```json
{
  "expo": {
    "name": "행운사주",
    "slug": "haengwoonsaju-app",
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/[your-project-id]",
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "extra": {
      "eas": {
        "projectId": "[your-project-id]"
      }
    }
  }
}
```

**설정 설명:**
- `runtimeVersion`: 업데이트 호환성 관리 (앱 버전 기반)
- `checkAutomatically`: 업데이트 확인 시점
  - `ON_LOAD`: 앱 시작 시 확인 (권장)
  - `ON_ERROR_RECOVERY`: 오류 발생 시에만 확인
  - `WIFI_ONLY`: WiFi 연결 시에만 확인
- `fallbackToCacheTimeout`: 다운로드 대기 시간 (0 = 무제한)

### 3단계: EAS Update 초기화

```bash
# 프로젝트 ID 자동 설정
eas update:configure
```

이 명령어는 자동으로:
- Expo 프로젝트 ID 생성
- `app.json`에 설정 추가
- EAS Update 서비스 활성화

### 4단계: eas.json 업데이트 설정 추가

[eas.json](eas.json)에 채널 설정 추가:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 업데이트 배포 방법

### 기본 업데이트 배포

#### 1. 코드 수정

예: 버그 수정, UI 개선, 텍스트 변경 등

```typescript
// app/luck.tsx - 예시: 에러 메시지 개선
const handleError = (error: string) => {
  Alert.alert(
    '오류',
    '일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.',  // 변경됨
    [{ text: '확인' }]
  );
};
```

#### 2. 업데이트 배포

```bash
# Production 채널에 업데이트 배포
eas update --branch production --message "버그 수정: 에러 메시지 개선"

# Preview 채널에 업데이트 배포
eas update --branch preview --message "테스트: 새로운 UI 변경"
```

#### 3. 배포 확인

```bash
# 최근 업데이트 목록 확인
eas update:list

# 특정 브랜치의 업데이트 확인
eas update:list --branch production
```

### 자동 업데이트 적용

사용자가 앱을 다시 시작하면 자동으로 업데이트가 적용됩니다:

1. 앱 시작 시 업데이트 확인
2. 백그라운드에서 다운로드
3. 다음 앱 재시작 시 적용

### 강제 업데이트 구현 (선택사항)

즉시 업데이트를 적용하려면 커스텀 로직 추가:

```typescript
// app/_layout.tsx에 추가
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return; // 개발 모드에서는 스킵

      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();

          // 사용자에게 알림
          Alert.alert(
            '업데이트 완료',
            '새로운 버전이 설치되었습니다.\n앱을 다시 시작합니다.',
            [
              {
                text: '확인',
                onPress: async () => {
                  await Updates.reloadAsync();
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('업데이트 확인 중 오류:', error);
      }
    }

    checkForUpdates();
  }, []);

  return (
    // 기존 레이아웃 코드
  );
}
```

---

## 업데이트 가능한 변경사항

### ✅ OTA로 업데이트 가능

| 카테고리 | 예시 |
|---------|------|
| **JavaScript 코드** | 비즈니스 로직, 이벤트 핸들러, 함수 수정 |
| **TypeScript 코드** | 타입 정의, 인터페이스 변경 |
| **React 컴포넌트** | UI 컴포넌트, 화면 레이아웃 수정 |
| **스타일** | CSS, StyleSheet 변경 |
| **에셋** | 이미지, 폰트, JSON 파일 교체 |
| **WebView URL** | `constants/Config.ts`의 URL 변경 |
| **텍스트** | 문구, 에러 메시지 수정 |
| **상수** | 설정 값, API 엔드포인트 변경 |

**예시: WebView URL 변경**
```typescript
// constants/Config.ts
export const Config = {
  API_HOST: 'https://new-domain.haengwoonsaju.com',  // OTA 가능 ✅
  IS_DEV_MODE: false,
};
```

### ❌ 새 빌드가 필요한 변경사항

| 카테고리 | 예시 | 이유 |
|---------|------|------|
| **네이티브 모듈 추가** | `expo install expo-camera` | 네이티브 코드 포함 |
| **앱 권한 변경** | `app.json`의 `permissions` 수정 | 스토어 심사 필요 |
| **빌드 설정** | `eas.json`, `app.json` 일부 변경 | 네이티브 설정 |
| **Expo SDK 업그레이드** | SDK 51 → 52 | 네이티브 종속성 변경 |
| **앱 아이콘/스플래시** | 아이콘, 스플래시 스크린 변경 | 네이티브 에셋 |
| **딥링크 스킴** | URL Scheme 추가/변경 | 네이티브 설정 |

**예시: 새 빌드 필요**
```json
// app.json - 권한 추가 (새 빌드 필요 ❌)
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "카메라 접근이 필요합니다"  // 새 빌드 필요
      }
    }
  }
}
```

---

## 채널 및 브랜치 전략

### 채널(Channel)이란?

**채널**은 빌드에 연결된 업데이트 스트림입니다.

```
빌드 (v1.0.0) → 채널 (production) → 브랜치 (production) → 업데이트들
```

### 권장 채널 전략

#### 1. 개발 환경 (Development)
```bash
# 빌드
eas build --platform all --profile development

# 업데이트
eas update --branch development --message "개발 중 테스트"
```

**용도**: 개발자 내부 테스트

#### 2. 테스트 환경 (Preview)
```bash
# 빌드
eas build --platform all --profile preview

# 업데이트
eas update --branch preview --message "QA 테스트용"
```

**용도**: QA팀 또는 베타 테스터

#### 3. 프로덕션 환경 (Production)
```bash
# 빌드
eas build --platform all --profile production

# 업데이트
eas update --branch production --message "v1.0.1: 버그 수정"
```

**용도**: 실제 사용자

### 다중 브랜치 전략

앱 버전별로 브랜치 분리:

```bash
# v1.0.x 사용자용 업데이트
eas update --branch production-1.0 --message "v1.0.2 패치"

# v1.1.x 사용자용 업데이트
eas update --branch production-1.1 --message "v1.1.1 패치"
```

**eas.json 설정:**
```json
{
  "build": {
    "production-1.0": {
      "channel": "production-1.0"
    },
    "production-1.1": {
      "channel": "production-1.1"
    }
  }
}
```

---

## 롤백 및 버전 관리

### 업데이트 롤백

문제가 있는 업데이트를 이전 버전으로 되돌리기:

#### 1. 업데이트 목록 확인
```bash
eas update:list --branch production
```

출력 예시:
```
┌────────┬─────────────────┬──────────────┬─────────────┐
│ Update │ Message         │ Runtime      │ Published   │
├────────┼─────────────────┼──────────────┼─────────────┤
│ abc123 │ 버그 수정       │ 1.0.1        │ 2분 전      │
│ def456 │ UI 개선         │ 1.0.1        │ 1시간 전    │
│ ghi789 │ 초기 출시       │ 1.0.0        │ 1일 전      │
└────────┴─────────────────┴──────────────┴─────────────┘
```

#### 2. 특정 업데이트로 롤백
```bash
# 이전 업데이트를 다시 배포
eas update --branch production --group def456
```

#### 3. 코드 롤백 후 재배포
```bash
# Git에서 이전 커밋으로 복구
git revert HEAD

# 새 업데이트 배포
eas update --branch production --message "롤백: 버그 수정 취소"
```

### 업데이트 삭제

```bash
# 특정 업데이트 삭제
eas update:delete --group abc123
```

⚠️ **주의**: 이미 다운로드한 사용자에게는 영향이 없습니다.

---

## 모니터링 및 분석

### 업데이트 현황 확인

#### 1. 대시보드에서 확인
```
https://expo.dev/accounts/[account]/projects/[project]/updates
```

**확인 가능 정보:**
- 업데이트 다운로드 수
- 활성 사용자 수
- 업데이트별 성공/실패율

#### 2. CLI로 확인
```bash
# 업데이트 목록
eas update:list --branch production

# 특정 업데이트 상세 정보
eas update:view abc123
```

### 로그 및 에러 추적

#### Sentry 연동 (권장)

```bash
# Sentry 설치
npx expo install @sentry/react-native

# 설정
npx @sentry/wizard@latest -i reactNative
```

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  enableInExpoDevelopment: false,
  debug: __DEV__,
});

export default Sentry.wrap(RootLayout);
```

#### 업데이트 성공/실패 추적

```typescript
import * as Updates from 'expo-updates';
import * as Sentry from '@sentry/react-native';

useEffect(() => {
  async function checkForUpdates() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();

        Sentry.captureMessage('OTA 업데이트 성공', {
          level: 'info',
          extra: {
            updateId: update.manifest?.id,
          },
        });

        await Updates.reloadAsync();
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error('업데이트 실패:', error);
    }
  }

  checkForUpdates();
}, []);
```

---

## 주의사항 및 제한사항

### Apple App Store 정책

#### ✅ 허용되는 경우
- 버그 수정
- 보안 패치
- 성능 개선
- 콘텐츠 업데이트
- UI/UX 개선

#### ❌ 금지되는 경우
- 앱의 주요 목적 변경
- 심사 우회 시도
- 악성 코드 주입
- 사용자 동의 없는 중대한 기능 변경

**Apple 가이드라인 3.3.2:**
> "앱은 설명, 스크린샷 및 미리보기에 명시된 대로 작동해야 하며, 중요한 변경사항은 앱 업데이트를 통해 제출해야 합니다."

### Google Play Store 정책

더 관대하지만 여전히 주의 필요:
- 악성 동작 금지
- 사용자 데이터 보호
- 앱 설명과 일치하는 기능

### 기술적 제한사항

#### 1. Runtime Version 호환성

OTA 업데이트는 **동일한 Runtime Version** 내에서만 작동:

```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"  // app.json의 version과 동일
    }
  }
}
```

**예시:**
- 빌드 버전: `1.0.0` → 업데이트 가능: `1.0.x` OTA
- 빌드 버전: `1.0.0` → 업데이트 불가: `1.1.0` (새 빌드 필요)

#### 2. 네이티브 모듈 변경

다음과 같은 경우 새 빌드 필요:

```bash
# 새 모듈 설치 - 새 빌드 필요 ❌
npx expo install expo-camera

# 기존 모듈 코드 수정 - OTA 가능 ✅
// WebView 설정 변경
```

#### 3. 앱 크기 제한

- **업데이트 크기**: 가능한 작게 유지 (권장: < 10MB)
- **다운로드 시간**: 사용자 경험 고려
- **캐시 관리**: 오래된 업데이트 자동 삭제

---

## 실전 워크플로우

### 긴급 버그 수정 시나리오

```bash
# 1. 버그 발견 (프로덕션)
# 2. 코드 수정
git checkout -b hotfix/payment-error
# ... 코드 수정 ...

# 3. 로컬 테스트
npm start

# 4. Preview 채널에 먼저 배포
eas update --branch preview --message "긴급: 결제 오류 수정"

# 5. QA 테스트 진행 (30분~1시간)

# 6. 문제 없으면 Production 배포
eas update --branch production --message "긴급: 결제 오류 수정"

# 7. 모니터링 (Sentry, 사용자 피드백)

# 8. 문제 발생 시 즉시 롤백
eas update --branch production --group [이전-버전-ID]
```

**소요 시간**: 버그 발견 → 수정 → 배포 = **1~2시간**
(스토어 심사: 2~7일 vs OTA: 1~2시간)

### 정기 업데이트 시나리오

```bash
# 1. 기능 개발 완료
git checkout -b feature/new-ui

# 2. Preview 채널 테스트
eas update --branch preview --message "신규: UI 개선"

# 3. 베타 테스터 피드백 수집 (1주일)

# 4. 수정 반영 및 재배포
eas update --branch preview --message "수정: UI 개선 v2"

# 5. Production 배포
git merge feature/new-ui
eas update --branch production --message "v1.0.2: UI 개선"

# 6. 점진적 배포 (선택)
# 일부 사용자에게만 먼저 배포 후 모니터링
```

### A/B 테스팅 시나리오

```bash
# 두 개의 브랜치 생성
eas update --branch production-variant-a --message "A안: 파란색 버튼"
eas update --branch production-variant-b --message "B안: 빨간색 버튼"

# 각 그룹에 다른 채널 할당
# 분석 후 성과 좋은 버전을 메인 채널에 배포
eas update --branch production --message "최종: 빨간색 버튼 (B안)"
```

---

## 체크리스트

### OTA 업데이트 전 체크리스트

- [ ] 변경사항이 OTA 가능한지 확인 (네이티브 코드 X)
- [ ] 로컬 테스트 완료
- [ ] Preview 채널에 먼저 배포 및 테스트
- [ ] 업데이트 메시지 명확하게 작성
- [ ] 모니터링 도구 준비 (Sentry 등)

### OTA 업데이트 후 체크리스트

- [ ] 업데이트 배포 확인 (`eas update:list`)
- [ ] 테스트 기기에서 업데이트 다운로드 확인
- [ ] 앱 재시작 후 정상 작동 확인
- [ ] 에러 로그 모니터링 (24시간)
- [ ] 사용자 피드백 확인

---

## FAQ

### Q1. OTA 업데이트는 언제 적용되나요?

**A**: 기본 설정(`checkAutomatically: "ON_LOAD"`)에서:
1. 앱 시작 시 업데이트 확인
2. 백그라운드에서 다운로드
3. **다음 앱 재시작 시** 적용

사용자가 앱을 종료하지 않으면 적용되지 않습니다.

### Q2. 모든 사용자에게 즉시 적용되나요?

**A**: 아니요. 사용자가 앱을 재시작할 때 다운로드하므로:
- 자주 사용하는 사용자: 몇 시간 내 적용
- 가끔 사용하는 사용자: 며칠 후 적용

### Q3. 업데이트 크기는 얼마나 되나요?

**A**: 변경된 파일만 다운로드:
- 작은 코드 수정: 100KB ~ 1MB
- 이미지 추가: 이미지 크기만큼
- 대규모 변경: 5MB ~ 10MB

### Q4. 오프라인 사용자는 어떻게 되나요?

**A**:
- 업데이트 다운로드 실패 시 기존 버전으로 계속 실행
- 다음 온라인 시 자동으로 다운로드

### Q5. 여러 버전을 동시에 지원할 수 있나요?

**A**: 네, 브랜치를 분리하면 가능:
```bash
# v1.0.x 사용자
eas update --branch production-1.0

# v1.1.x 사용자
eas update --branch production-1.1
```

### Q6. OTA 업데이트 비용은?

**A**: **무료**
- Expo 무료 플랜: 무제한 OTA 업데이트
- 대역폭 제한: 없음
- 저장 공간: 충분

### Q7. 스토어 정책 위반하면?

**A**:
- **Apple**: 앱 삭제 또는 계정 정지
- **Google**: 경고 후 삭제

안전하게 사용하려면:
- 주요 기능 변경 시 스토어 심사 통과
- 버그 수정 및 마이너 개선에만 OTA 사용

---

## 추가 자료

### 공식 문서
- [Expo Updates 공식 문서](https://docs.expo.dev/eas-update/introduction/)
- [EAS Update 가이드](https://docs.expo.dev/eas-update/getting-started/)
- [Runtime Version](https://docs.expo.dev/eas-update/runtime-versions/)

### 모범 사례
- [Expo Blog: OTA Updates Best Practices](https://blog.expo.dev/)
- [React Native OTA Patterns](https://reactnative.dev/)

### 커뮤니티
- [Expo Discord](https://chat.expo.dev/)
- [Expo Forums](https://forums.expo.dev/)

---

## 요약

### OTA 업데이트 핵심 명령어

```bash
# 설정
eas update:configure

# 업데이트 배포
eas update --branch production --message "버그 수정"

# 업데이트 확인
eas update:list --branch production

# 롤백
eas update --branch production --group [이전-버전-ID]
```

### 사용 시나리오

| 상황 | 방법 | 소요 시간 |
|------|------|----------|
| 긴급 버그 수정 | OTA 업데이트 | 1-2시간 |
| 텍스트 수정 | OTA 업데이트 | 30분 |
| UI 개선 | OTA 업데이트 | 1시간 |
| 새 기능 추가 (JS만) | OTA 업데이트 | 2-4시간 |
| 네이티브 모듈 추가 | 새 빌드 + 스토어 심사 | 2-7일 |
| 권한 변경 | 새 빌드 + 스토어 심사 | 2-7일 |

---

이제 앱을 빠르고 안전하게 업데이트할 수 있습니다! 🚀

**다음 단계**: [BUILD_DEPLOYMENT_GUIDE.md](BUILD_DEPLOYMENT_GUIDE.md)와 함께 사용하여 완벽한 배포 프로세스를 구축하세요.
