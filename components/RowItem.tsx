// Reussable row item component for lists
import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";
import Card from "./Card";

export default function RowItem({
  title,
  caption,
  onPress,
  bg = "#111",
  border = "#1b1b1b",
  style,
}: {
  title: string;
  caption?: string;
  onPress?: () => void;
  bg?: string;
  border?: string;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <Pressable onPress={onPress}>
      <Card bg={bg} border={border} style={style}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>{title}</Text>
        {caption ? <Text style={{ color: "#999" }}>{caption}</Text> : null}
      </Card>
    </Pressable>
  );
}
