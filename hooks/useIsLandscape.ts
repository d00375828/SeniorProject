// Helps support landscape mode but will probably delete

import { useWindowDimensions } from "react-native";
export default function useIsLandscape() {
  const { width, height } = useWindowDimensions();
  return width > height;
}
