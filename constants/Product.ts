import { Platform } from 'react-native';

export const ProductItem: string[] =
  Platform.select({
    ios: [
      "NewyearFortune",
      "WorkFortune",
      "ExamFortune",
      "LoveFortune",
      "MatchPremium",
      "Bigfortune",
    ],
    android: [
      "newyearfortune",
      "workfortune",
      "examfortune",
      "lovefortune",
      "matchpremium",
      "bigfortune",
    ],
  }) ?? [];
