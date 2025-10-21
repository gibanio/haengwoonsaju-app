import { Redirect } from "expo-router";

// 앱스토어 통과를 위해 임시로 오행샵을 기본 페이지로 설정
// OTA 업데이트로 /luck으로 되돌릴 예정
export default function Index() {
  return <Redirect href={"/shop" as any} />;
}
