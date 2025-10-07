import React from "react";
import { Image, StyleSheet } from "react-native";

interface CustomTabIconProps {
  focused: boolean;
  iconSource: any;
  size?: number;
}

export default function CustomTabIcon({
  focused,
  iconSource,
  size = 24,
}: CustomTabIconProps) {
  return (
    <Image
      source={iconSource}
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    // 아이콘 스타일
  },
});
