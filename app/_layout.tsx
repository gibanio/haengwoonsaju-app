import "react-native-reanimated";

import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import CustomTabIcon from "@/components/CustomTabIcon";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

const CustomTabButton = ({
  children,
  onPress,
  focused,
}: {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  focused: boolean;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        pressed && styles.tabButtonPressed,
      ]}
    >
      <View style={[styles.tabContent, focused && styles.tabContentActive]}>
        {children}
      </View>
    </Pressable>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // OTA 업데이트 체크 및 적용
  useEffect(() => {
    async function checkForUpdates() {
      try {
        // 개발 모드에서는 업데이트 체크 안 함
        if (__DEV__) {
          console.log("[Update] 개발 모드에서는 업데이트 체크를 건너뜁니다.");
          return;
        }

        console.log("[Update] 업데이트 확인 중...");
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log("[Update] 새로운 업데이트 발견! 다운로드 시작...");
          await Updates.fetchUpdateAsync();
          console.log("[Update] 업데이트 다운로드 완료. 앱을 재시작합니다.");

          // 즉시 강제 적용 (사용자 선택 없음)
          await Updates.reloadAsync();
        } else {
          console.log("[Update] 최신 버전을 사용 중입니다.");
        }
      } catch (error) {
        console.error("[Update] 업데이트 확인 중 오류:", error);
        // 업데이트 체크 실패는 앱 동작에 영향을 주지 않음
      }
    }

    checkForUpdates();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#000000",
          tabBarInactiveTintColor: "#000000",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E5E7EB",
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 92 : 72,
            paddingBottom: Platform.OS === "ios" ? 24 : 12,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginTop: 4,
          },
          tabBarButton: (props) => (
            <CustomTabButton
              onPress={props.onPress}
              focused={props.accessibilityState?.selected || false}
            >
              {props.children}
            </CustomTabButton>
          ),
        }}
      >
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
      </Tabs>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonPressed: {
    opacity: 0.7,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  tabContentActive: {
    backgroundColor: "#F5F5F5",
  },
});
