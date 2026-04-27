import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import AppButton from "@/components/AppButton";
import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import {
  AttachmentKind,
  SessionAttachment,
  useSession,
  useTheme,
} from "@/context";
import { uploadRoleplayContext } from "@/lib/roleplay/client";

const ATTACHMENT_KIND_OPTIONS: { kind: AttachmentKind; label: string }[] = [
  { kind: "slides", label: "Slides" },
  { kind: "instructions", label: "Instructions" },
  { kind: "rubric", label: "Rubric" },
  { kind: "resume", label: "Resume" },
  { kind: "job-listing", label: "Job Listing" },
  { kind: "notes", label: "Notes" },
];
const MAX_ATTACHMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_ATTACHMENT_EXTENSIONS = [".pdf", ".txt", ".md"];

const scenarioAccent = {
  "team-presentation": "#25b8a6",
  "job-interview": "#67a6ff",
  "difficult-conversation": "#ff7d6b",
  "q-and-a-pressure": "#f2c14e",
} as const;

const scenarioGlow = {
  "team-presentation": "rgba(37, 184, 166, 0.18)",
  "job-interview": "rgba(103, 166, 255, 0.18)",
  "difficult-conversation": "rgba(255, 125, 107, 0.18)",
  "q-and-a-pressure": "rgba(242, 193, 78, 0.18)",
} as const;

type FieldKey = "userRole" | "objective" | "partnerStyle";
type AttachmentFieldKey = "attachmentKind";

const customOption = "custom";

type SelectOption = {
  label: string;
  value: string;
};

function hasSupportedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return SUPPORTED_ATTACHMENT_EXTENSIONS.some((extension) =>
    lower.endsWith(extension)
  );
}

export default function SetupScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const { colors } = useTheme();
  const { scenarios, startSession } = useSession();

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId),
    [scenarioId, scenarios]
  );

  const [userRole, setUserRole] = useState(
    scenario?.defaultConfig.userRole ?? ""
  );
  const [objective, setObjective] = useState(
    scenario?.defaultConfig.objective ?? ""
  );
  const [partnerStyle, setPartnerStyle] = useState(
    scenario?.defaultConfig.partnerStyle ?? ""
  );
  const [dropdownOpen, setDropdownOpen] = useState<FieldKey | null>(null);
  const [attachmentDropdownOpen, setAttachmentDropdownOpen] =
    useState<AttachmentFieldKey | null>(null);
  const [customField, setCustomField] = useState<FieldKey | null>(null);
  const [selectedAttachmentKind, setSelectedAttachmentKind] =
    useState<AttachmentKind>("slides");
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const userRoleInputRef = useRef<TextInput>(null);
  const objectiveInputRef = useRef<TextInput>(null);
  const partnerStyleInputRef = useRef<TextInput>(null);

  const featuredAccent = scenario
    ? scenarioAccent[scenario.id as keyof typeof scenarioAccent] ??
      colors.accent
    : colors.accent;
  const featuredGlow =
    scenario && scenarioGlow[scenario.id as keyof typeof scenarioGlow]
      ? scenarioGlow[scenario.id as keyof typeof scenarioGlow]
      : "rgba(37, 184, 166, 0.18)";

  const fieldOptions: Record<FieldKey, SelectOption[]> = {
    userRole: [
      { label: "Speaker", value: "Speaker" },
      { label: "Presenter", value: "Presenter" },
      { label: "Leader", value: "Leader" },
      { label: "Candidate", value: "Candidate" },
      { label: "Custom", value: customOption },
    ],
    objective: [
      {
        label: "Open clearly and keep steady pacing",
        value: "Open clearly and keep steady pacing",
      },
      {
        label: "Answer with structure and specific examples",
        value: "Answer with structure and specific examples",
      },
      {
        label: "Stay calm, empathic, and direct",
        value: "Stay calm, empathic, and direct",
      },
      {
        label: "Recover quickly from pressure",
        value: "Recover quickly from pressure",
      },
      { label: "Custom", value: customOption },
    ],
    partnerStyle: [
      {
        label: "Supportive but attentive audience",
        value: "Supportive but attentive audience",
      },
      {
        label: "Professional interviewer with follow-ups",
        value: "Professional interviewer with follow-ups",
      },
      {
        label: "Emotionally charged but open to dialogue",
        value: "Emotionally charged but open to dialogue",
      },
      {
        label: "Curious but challenging questioner",
        value: "Curious but challenging questioner",
      },
      { label: "Custom", value: customOption },
    ],
  };

  function getFieldValue(field: FieldKey) {
    switch (field) {
      case "userRole":
        return userRole;
      case "objective":
        return objective;
      case "partnerStyle":
        return partnerStyle;
    }
  }

  function setFieldValue(field: FieldKey, value: string) {
    switch (field) {
      case "userRole":
        setUserRole(value);
        return;
      case "objective":
        setObjective(value);
        return;
      case "partnerStyle":
        setPartnerStyle(value);
        return;
    }
  }

  function getFieldPlaceholder(field: FieldKey) {
    switch (field) {
      case "userRole":
        return "Presenter";
      case "objective":
        return "Uncover pains and secure a next step";
      case "partnerStyle":
        return "Supportive but attentive audience";
    }
  }

  function getFieldLabel(field: FieldKey) {
    switch (field) {
      case "userRole":
        return "Your role";
      case "objective":
        return "Objective";
      case "partnerStyle":
        return "Audience or partner style";
    }
  }

  function getInputRef(field: FieldKey) {
    switch (field) {
      case "userRole":
        return userRoleInputRef;
      case "objective":
        return objectiveInputRef;
      case "partnerStyle":
        return partnerStyleInputRef;
    }
  }

  function openCustomField(field: FieldKey) {
    setFieldValue(field, "");
    setCustomField(field);
    setDropdownOpen(null);
    requestAnimationFrame(() => {
      getInputRef(field).current?.focus();
    });
  }

  function renderField(field: FieldKey) {
    const isOpen = dropdownOpen === field;
    const isCustom = customField === field;
    const value = getFieldValue(field);
    const label = getFieldLabel(field);
    const placeholder = getFieldPlaceholder(field);
    const inputRef = getInputRef(field);
    const options = fieldOptions[field];
    const summaryText = value.trim() || (isCustom ? "Custom" : placeholder);

    return (
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
          {label}
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: isOpen || isCustom ? featuredAccent : colors.border,
            borderRadius: 14,
            backgroundColor: colors.box,
            overflow: "hidden",
          }}
        >
          {isCustom ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            >
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={(text) => setFieldValue(field, text)}
                placeholder=""
                placeholderTextColor={colors.muted}
                autoFocus
                style={{
                  flex: 1,
                  color: colors.fg,
                  fontWeight: "700",
                  padding: 0,
                }}
              />
              <Pressable
                onPress={() => setDropdownOpen(isOpen ? null : field)}
                style={{ paddingLeft: 12, paddingVertical: 2 }}
              >
                <Text style={{ color: featuredAccent, fontWeight: "800" }}>
                  {isOpen ? "▴" : "▾"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setDropdownOpen(isOpen ? null : field)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: value.trim() ? colors.fg : colors.muted,
                  fontWeight: "700",
                  flex: 1,
                  paddingRight: 12,
                }}
                numberOfLines={1}
              >
                {summaryText}
              </Text>
              <Text style={{ color: featuredAccent, fontWeight: "800" }}>
                {isOpen ? "▴" : "▾"}
              </Text>
            </Pressable>
          )}
        </View>

        {isOpen ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              backgroundColor: colors.card,
              padding: 10,
              gap: 8,
            }}
          >
            {options.map((option) => {
              const selected =
                option.value !== customOption && option.value === value;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    setDropdownOpen(null);
                    if (option.value === customOption) {
                      openCustomField(field);
                      return;
                    }
                    setCustomField(null);
                    setFieldValue(field, option.value);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? featuredAccent : colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: selected ? featuredGlow : colors.box,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? featuredAccent : colors.fg,
                      fontWeight: "700",
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  }

  const preview = useMemo(() => {
    const resolvedUserRole =
      userRole.trim() || scenario?.defaultConfig.userRole || "";
    const resolvedObjective =
      objective.trim() || scenario?.defaultConfig.objective || "";
    const resolvedPartnerStyle =
      partnerStyle.trim() || scenario?.defaultConfig.partnerStyle || "";
    const filledFields = [
      userRole.trim(),
      objective.trim(),
      partnerStyle.trim(),
    ].filter(Boolean).length;

    return {
      resolvedUserRole,
      resolvedObjective,
      resolvedPartnerStyle,
      filledFields,
      readinessLabel:
        filledFields === 3
          ? "Ready to start"
          : filledFields === 2
          ? "Almost ready"
          : "Quick setup",
    };
  }, [
    objective,
    partnerStyle,
    scenario?.defaultConfig.objective,
    scenario?.defaultConfig.partnerStyle,
    scenario?.defaultConfig.userRole,
    userRole,
  ]);

  if (!scenario) {
    router.replace("/");
    return null;
  }

  async function onPickDocument() {
    if (uploadBusy) return;

    try {
      setUploadError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain", "text/markdown"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.name || "context-upload";
      const mimeType = asset.mimeType || "application/octet-stream";

      if (!hasSupportedExtension(fileName)) {
        throw new Error(
          "Unsupported file type. Upload a PDF, TXT, or Markdown file."
        );
      }

      if (
        typeof asset.size === "number" &&
        asset.size > MAX_ATTACHMENT_FILE_SIZE_BYTES
      ) {
        throw new Error(
          "That file is too large. Upload a file smaller than 10 MB."
        );
      }

      setUploadBusy(true);
      const attachment = await uploadRoleplayContext(
        asset.uri,
        fileName,
        mimeType,
        selectedAttachmentKind
      );

      setAttachments((current) => [...current, attachment]);
    } catch (error: any) {
      const message =
        error?.message ?? "Unable to upload and process that document.";
      setUploadError(message);
      Alert.alert("Upload failed", message);
    } finally {
      setUploadBusy(false);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  return (
    <Screen backgroundColor={colors.bg} scroll={false}>
      <View style={{ flex: 1, padding: 16, gap: 16 }}>
        <PageHeader title="Setup" left={<BackButton />} />

        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
        >
          <Card
            bg={colors.card}
            border={colors.border}
            style={{
              gap: 14,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -48,
                right: -28,
                width: 160,
                height: 160,
                borderRadius: 999,
                backgroundColor: featuredGlow,
              }}
            />
            <View
              style={{
                position: "absolute",
                left: -28,
                bottom: -34,
                width: 120,
                height: 120,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            />

            <View style={{ gap: 10 }}>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  fontWeight: "800",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Scenario setup
              </Text>
              <Text
                style={{ color: colors.fg, fontSize: 26, fontWeight: "900" }}
              >
                {scenario.title}
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 22 }}>
                {scenario.description}
              </Text>
            </View>
          </Card>

          <Card style={{ gap: 12 }}>
            <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800" }}>
              Session configuration
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 21 }}>
              Start with the defaults, or customize to fit you!
            </Text>

            {renderField("userRole")}
            {renderField("objective")}
            {renderField("partnerStyle")}
          </Card>

          <Card style={{ gap: 12 }}>
            <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800" }}>
              Preview
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 21 }}>
              This is your session with the current setup.
            </Text>

            <Card bg={colors.box} border={colors.border} style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      color: colors.fg,
                      fontSize: 18,
                      fontWeight: "900",
                    }}
                  >
                    {preview.resolvedUserRole}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4, flex: 1 }}>
                  <Text
                    style={{
                      color: featuredAccent,
                      fontSize: 18,
                      fontWeight: "900",
                    }}
                  >
                    {preview.readinessLabel}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Objective
                </Text>
                <Text style={{ color: colors.fg, lineHeight: 21 }}>
                  {preview.resolvedObjective}
                </Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Partner style
                </Text>
                <Text style={{ color: colors.fg, lineHeight: 21 }}>
                  {preview.resolvedPartnerStyle}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: colors.fg,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {preview.filledFields}/3 fields set
                  </Text>
                </View>
              </View>
            </Card>
          </Card>

          <Card style={{ gap: 12 }}>
            <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800" }}>
              Upload materials - Optional
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 21 }}>
              Upload context documents for the scenario. The AI will use them
              to guide your roleplay.
            </Text>

            <Card bg={colors.box} border={colors.border} style={{ gap: 8 }}>
              <Text
                style={{
                  color: featuredAccent,
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                Supported files
              </Text>
              <Text style={{ color: colors.fg, lineHeight: 21 }}>
                PDF, TXT, and Markdown. Upload as many files as you need, up to
                10 MB each.
              </Text>
            </Card>

            <View style={{ gap: 8 }}>
              <Text
                style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}
              >
                Material type
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor:
                    attachmentDropdownOpen === "attachmentKind"
                      ? featuredAccent
                      : colors.border,
                  borderRadius: 14,
                  backgroundColor: colors.box,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() =>
                    setAttachmentDropdownOpen(
                      attachmentDropdownOpen === "attachmentKind"
                        ? null
                        : "attachmentKind"
                    )
                  }
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.fg,
                      fontWeight: "700",
                      flex: 1,
                      paddingRight: 12,
                    }}
                    numberOfLines={1}
                  >
                    {
                      ATTACHMENT_KIND_OPTIONS.find(
                        (option) => option.kind === selectedAttachmentKind
                      )?.label
                    }
                  </Text>
                  <Text style={{ color: featuredAccent, fontWeight: "800" }}>
                    {attachmentDropdownOpen === "attachmentKind" ? "▴" : "▾"}
                  </Text>
                </Pressable>
              </View>

              {attachmentDropdownOpen === "attachmentKind" ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    backgroundColor: colors.card,
                    padding: 10,
                    gap: 8,
                  }}
                >
                  {ATTACHMENT_KIND_OPTIONS.map((option) => {
                    const selected = selectedAttachmentKind === option.kind;
                    return (
                      <Pressable
                        key={option.kind}
                        onPress={() => {
                          setSelectedAttachmentKind(option.kind);
                          setAttachmentDropdownOpen(null);
                        }}
                        style={{
                          borderWidth: 1,
                          borderColor: selected ? featuredAccent : colors.border,
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          backgroundColor: selected ? featuredGlow : colors.box,
                        }}
                      >
                        <Text
                          style={{
                            color: selected ? featuredAccent : colors.fg,
                            fontWeight: "700",
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <AppButton
              title={
                uploadBusy
                  ? "Uploading..."
                  : `Upload ${
                      ATTACHMENT_KIND_OPTIONS.find(
                        (option) => option.kind === selectedAttachmentKind
                      )?.label ?? "Material"
                    }`
              }
              color={featuredAccent}
              fg={colors.onAccent}
              disabled={uploadBusy}
              onPress={onPickDocument}
            />

            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Each file is tagged with the selected material type.
            </Text>

            {uploadError ? (
              <Text style={{ color: "#ffb3b3" }}>{uploadError}</Text>
            ) : null}

            {attachments.length ? (
              <View style={{ gap: 10 }}>
                {attachments.map((attachment) => (
                  <Card
                    key={attachment.id}
                    bg={colors.box}
                    border={colors.border}
                    style={{ gap: 8 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ color: colors.fg, fontWeight: "800" }}>
                          {attachment.name}
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>
                          {attachment.kind} | {attachment.mimeType}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => removeAttachment(attachment.id)}
                      >
                        <Text
                          style={{ color: colors.accent, fontWeight: "700" }}
                        >
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={{ color: colors.muted, lineHeight: 20 }}>
                      {attachment.promptText.slice(0, 180)}
                      {attachment.promptText.length > 180 ? "..." : ""}
                    </Text>
                  </Card>
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.muted, lineHeight: 21 }}>
                No supporting materials added yet.
              </Text>
            )}
          </Card>
        </ScrollView>

        <View style={{ paddingVertical: 4 }}>
          <AppButton
            title="Start Roleplay"
            color={featuredAccent}
            fg={colors.onAccent}
            style={{
              paddingVertical: 15,
              paddingHorizontal: 20,
              borderRadius: 14,
            }}
            onPress={() => {
              startSession({
                scenarioId: scenario.id,
                userRole: userRole.trim() || scenario.defaultConfig.userRole,
                objective: objective.trim() || scenario.defaultConfig.objective,
                partnerStyle:
                  partnerStyle.trim() || scenario.defaultConfig.partnerStyle,
                attachments,
              });
              router.push("/session" as any);
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
