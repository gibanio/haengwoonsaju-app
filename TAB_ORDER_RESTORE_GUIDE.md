# 탭바 순서 복원 가이드

## 개요

이 문서는 앱스토어 통과를 위해 임시로 변경한 탭바 순서를 원래대로 되돌리는 방법을 설명합니다.

## 변경 내역

### 변경 전 (원본)
- 탭 순서: **행운** → 사주풀이 → 오행샵 → 마이
- 기본 페이지: **행운** 탭

### 변경 후 (현재 - 앱스토어 제출용)
- 탭 순서: **오행샵** → 마이 → 사주풀이
- 기본 페이지: **오행샵** 탭
- **행운 탭 숨김 처리** (href: null)

## 백업 파일 위치

변경 전 파일들은 다음 위치에 백업되어 있습니다:

```
app/_layout.tsx.backup
app/index.tsx.backup
```

## 복원 방법

### 방법 1: 백업 파일 사용 (권장)

백업 파일을 원본 파일로 복사하여 복원합니다:

```bash
# 프로젝트 루트 디렉토리에서 실행
cp app/_layout.tsx.backup app/_layout.tsx
cp app/index.tsx.backup app/index.tsx
```

### 방법 2: 수동 편집

#### 1. app/_layout.tsx 복원

파일 경로: `app/_layout.tsx`

**변경 대상**: Tabs.Screen 컴포넌트들의 순서 변경

```tsx
{/* 변경 전 순서로 복원 */}
<Tabs.Screen
  name="index"
  options={{
    href: null, // 탭바에서 숨김
  }}
/>
<Tabs.Screen
  name="luck"
  options={{
    title: "행운",
    tabBarIcon: ({ focused }) => (
      <CustomTabIcon
        focused={focused}
        iconSource={require("../assets/images/luck_icon.png")}
        size={24}
      />
    ),
  }}
/>
<Tabs.Screen
  name="fortune"
  options={{
    title: "사주풀이",
    tabBarIcon: ({ focused }) => (
      <CustomTabIcon
        focused={focused}
        iconSource={require("../assets/images/fortune_icon.png")}
        size={24}
      />
    ),
  }}
/>
<Tabs.Screen
  name="shop"
  options={{
    title: "오행샵",
    tabBarIcon: ({ focused }) => (
      <CustomTabIcon
        focused={focused}
        iconSource={require("../assets/images/shop_icon.png")}
        size={24}
      />
    ),
  }}
/>
<Tabs.Screen
  name="mypage"
  options={{
    title: "마이",
    tabBarIcon: ({ focused }) => (
      <CustomTabIcon
        focused={focused}
        iconSource={require("../assets/images/mypage_icon.png")}
        size={24}
      />
    ),
  }}
/>
```

**주의**: luck 탭의 `href: null` 옵션을 **제거**해야 합니다.

#### 2. app/index.tsx 복원

파일 경로: `app/index.tsx`

**변경 대상**: Redirect href 속성

```tsx
import { Redirect } from "expo-router";

// 기본적으로 luck 탭으로 리다이렉트
export default function Index() {
  return <Redirect href={"/luck" as any} />;
}
```

## 복원 후 확인사항

### 1. 개발 환경에서 테스트

```bash
npm start
# 또는
npx expo start
```

### 2. 확인할 항목

- [ ] 앱 시작 시 **행운** 탭이 표시되는지 확인
- [ ] 하단 탭바 순서가 **행운 → 사주풀이 → 오행샵 → 마이** 순인지 확인
- [ ] 모든 탭이 정상적으로 동작하는지 확인
- [ ] 행운 탭에서 인앱구매 기능이 정상 동작하는지 확인

## OTA 업데이트 배포

Expo의 EAS Update를 사용하여 앱스토어 심사 통과 후 즉시 복원할 수 있습니다:

### 1. 복원 적용

위의 복원 방법 중 하나를 선택하여 파일을 복원합니다.

### 2. EAS Update 배포

```bash
# 프로덕션 업데이트 배포
eas update --branch production --message "탭 순서 원복: 행운 탭 복원"

# 또는 특정 채널로 배포
eas update --channel production --message "탭 순서 원복: 행운 탭 복원"
```

### 3. 배포 확인

```bash
# 최근 업데이트 확인
eas update:list

# 특정 업데이트 상세 정보
eas update:view [UPDATE_ID]
```

## 주의사항

⚠️ **중요**: OTA 업데이트는 이미 설치된 앱에만 적용됩니다.

- 앱스토어에서 새로 다운로드하는 사용자는 원래 빌드(오행샵이 첫 화면)를 받게 됩니다.
- 따라서 앱스토어 심사 통과 후 **새로운 빌드를 제출**하는 것을 권장합니다.

## 완전한 복원 절차 (앱스토어 재제출)

앱스토어 심사 통과 후 완전히 원래대로 되돌리려면:

### 1. 소스코드 복원

```bash
cp app/_layout.tsx.backup app/_layout.tsx
cp app/index.tsx.backup app/index.tsx
```

### 2. 버전 업데이트

`app.json` 파일에서 버전 증가:

```json
{
  "expo": {
    "version": "2.0.4",  // 현재 버전에서 증가
    "ios": {
      "buildNumber": "..."  // EAS가 자동 증가
    },
    "android": {
      "versionCode": ...  // EAS가 자동 증가
    }
  }
}
```

### 3. 새로운 빌드 생성

```bash
# iOS 프로덕션 빌드
eas build --platform ios --profile production

# Android 프로덕션 빌드
eas build --platform android --profile production

# 또는 둘 다
eas build --platform all --profile production
```

### 4. 앱스토어 재제출

생성된 빌드를 각 스토어에 제출합니다.

## 문제 해결

### 백업 파일이 없는 경우

Git 히스토리에서 복원할 수 있습니다:

```bash
# 변경 전 커밋 해시 확인
git log --oneline app/_layout.tsx app/index.tsx

# 특정 커밋에서 파일 복원
git checkout [COMMIT_HASH] -- app/_layout.tsx app/index.tsx
```

### OTA 업데이트가 적용되지 않는 경우

1. 앱을 완전히 종료하고 재시작
2. EAS Update 채널 설정 확인
3. `app.json`의 `updates` 설정 확인

## 변경 이력

- **2025-01-XX**: 앱스토어 통과를 위해 탭 순서 변경 및 행운 탭 숨김
- **백업 생성**: `_layout.tsx.backup`, `index.tsx.backup`

## 관련 파일

- [app/_layout.tsx](app/_layout.tsx) - 탭 네비게이션 레이아웃
- [app/index.tsx](app/index.tsx) - 기본 페이지 리다이렉트
- [app/_layout.tsx.backup](app/_layout.tsx.backup) - 원본 레이아웃 백업
- [app/index.tsx.backup](app/index.tsx.backup) - 원본 인덱스 백업
