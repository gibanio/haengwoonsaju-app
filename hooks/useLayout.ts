import {
  Dimensions,
  Platform,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const getVisibleScreenSize = () => {
  const window = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("screen").height;
  const windowHeight = Dimensions.get("window").height;

  let bottomTabBarHeight = 50;
  let statusBarHeight = 0;
  let navigationBarHeight = 0;
  let visibleWidth = window.width;
  let visibleHeight = windowHeight;

  if (Platform.OS === "ios") {
    if (window.width <= 375 && window.height <= 667) {
      bottomTabBarHeight = 50;
    } else {
      bottomTabBarHeight = 80;
    }

    visibleHeight = visibleHeight - bottomTabBarHeight;
  } else {
    statusBarHeight = insets.top;
    navigationBarHeight =
      insets.bottom === 0
        ? screenHeight - windowHeight - insets.top
        : insets.bottom;

    navigationBarHeight = navigationBarHeight < 48 ? 48 : navigationBarHeight;

    visibleWidth = Math.round(window.width);
    visibleHeight = Math.round(
      screenHeight - navigationBarHeight - bottomTabBarHeight
    );
  }

  return {
    visibleWidth: visibleWidth,
    visibleHeight: visibleHeight,
  };
};

const useLayout = () => {
  const { width, height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();

  const statusBarHeight =
    Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0;

  const { visibleWidth, visibleHeight } = getVisibleScreenSize();

  return {
    width,
    height,
    top,
    bottom,
    statusBarHeight,
    visibleWidth,
    visibleHeight,
  };
};

export default useLayout;
