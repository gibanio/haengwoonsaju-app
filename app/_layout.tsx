import "react-native-reanimated";

import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
            height: Platform.OS === "ios" ? 88 : 68,
            paddingBottom: Platform.OS === "ios" ? 20 : 8,
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
