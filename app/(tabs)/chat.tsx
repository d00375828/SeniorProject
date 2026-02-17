// app/(tabs)/chat.tsx
import Composer from "@/components/Composer";
import MessageBubble from "@/components/MessageBubble";
import { useTheme } from "@/context";
import { useChat } from "@/hooks/useChat";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";

export default function Chat() {
  const { colors } = useTheme();
  const { messages, send, sending, error } = useChat();
  const [text, setText] = useState("");

  return (
    <Screen scroll={false} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <PageHeader title="Chat" />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
          renderItem={({ item }) => <MessageBubble item={item} />}
          ListHeaderComponent={
            <>
              {sending ? (
                <View style={{ alignSelf: "flex-start", marginVertical: 6 }}>
                  <View
                    style={{
                      backgroundColor: colors.box,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 14,
                    }}
                  >
                    <Text style={{ color: colors.muted }}>
                      Assistant is thinking…
                    </Text>
                  </View>
                </View>
              ) : null}
              {error ? (
                <View style={{ alignSelf: "center", marginVertical: 6 }}>
                  <Text style={{ color: "#ff6b6b" }}>{error}</Text>
                </View>
              ) : null}
            </>
          }
        />

        <Composer
          value={text}
          onChange={setText}
          onSend={() => {
            const t = text.trim();
            if (!t) return;
            send(t);
            setText("");
          }}
          disabled={sending}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
