import { Platform } from "react-native";

export const ProductItem: string[] =
  Platform.select({
    ios: [
      "NewyearFortune",
      "WorkFortune",
      "ExamFortune",
      "LoveFortune",
      "MatchPremium",
    ],
    android: ["com.yourapp.product1"],
  }) ?? [];
