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
    android: [
      "newyearfortune",
      "workfortune",
      "examfortune",
      "lovefortune",
      "matchpremium",
    ],
  }) ?? [];
