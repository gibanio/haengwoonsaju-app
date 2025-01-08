import { Platform } from 'react-native';

export const ProductItem: string[] =
  Platform.select({
    ios: ["NewyearFortune", "WorkFortune"],
    android: ["com.yourapp.product1"],
  }) ?? [];
