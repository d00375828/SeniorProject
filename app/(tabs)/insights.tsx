// app/(tabs)/insights.tsx
import { useRecordings, useTheme } from "@/context";
import { ORDERED_METRIC_LABELS } from "@/lib/audio/grade";
import React, { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import RadarChart from "../../components/RadarChart";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";

function metricOf(item: any, label: string): number {
  const v = item?.ai?.metrics?.[label];
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export default function Insights() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { history } = useRecordings();
  const items = Array.isArray(history) ? history : [];

  // Overall Pitch Grade (prefer server overallScore)
  const { avgScoreText, count } = useMemo(() => {
    const scores = items
      .map((r: any) =>
        Number.isFinite(r?.ai?.overallScore)
          ? Number(r.ai.overallScore)
          : Number.isFinite(r?.score)
          ? Number(r.score)
          : NaN
      )
      .filter((n) => Number.isFinite(n));
    const avg = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : NaN;
    return {
      avgScoreText: Number.isFinite(avg) ? String(Math.round(avg)) : "—",
      count: items.length,
    };
  }, [items]);

  // Averaged metrics for radar + breakdown
  const { labels, values01, values10 } = useMemo(() => {
    const sums: Record<string, { total: number; n: number }> = {};
    ORDERED_METRIC_LABELS.forEach((k) => (sums[k] = { total: 0, n: 0 }));
    items.forEach((r) => {
      ORDERED_METRIC_LABELS.forEach((k) => {
        const v = metricOf(r, k);
        if (Number.isFinite(v)) {
          sums[k].total += v;
          sums[k].n += 1;
        }
      });
    });
    const vals10 = ORDERED_METRIC_LABELS.map((k) => {
      const { total, n } = sums[k];
      const avg = n ? total / n : NaN;
      return Number.isFinite(avg) ? Math.max(0, Math.min(10, avg)) : 0;
    });
    const vals01 = vals10.map((v) => v / 10);
    return {
      labels: ORDERED_METRIC_LABELS.slice(),
      values10: vals10,
      values01: vals01,
    };
  }, [items]);

  // Recent Trends
  const { improving, consistent, watch } = useMemo(() => {
    const N = Math.min(3, items.length);
    const M = Math.min(3, Math.max(0, items.length - N));
    const recent = items.slice(0, N);
    const prev = items.slice(N, N + M);
    type Delta = { label: string; curr: number; prev: number; delta: number };

    const deltas: Delta[] = ORDERED_METRIC_LABELS.map((k) => {
      const avgWindow = (arr: any[]) => {
        const vals = arr
          .map((it) => metricOf(it, k))
          .filter((n) => Number.isFinite(n));
        if (!vals.length) return NaN;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      };
      const curr = avgWindow(recent);
      const prv = avgWindow(prev);
      const d =
        (Number.isFinite(curr) ? curr : NaN) -
        (Number.isFinite(prv) ? prv : NaN);
      return {
        label: k,
        curr: Number.isFinite(curr) ? curr : NaN,
        prev: Number.isFinite(prv) ? prv : NaN,
        delta: Number.isFinite(d) ? d : NaN,
      };
    });

    const improvingCand = deltas
      .filter((x) => Number.isFinite(x.delta))
      .sort((a, b) => b.delta - a.delta)[0];

    const watchCand = deltas
      .filter((x) => Number.isFinite(x.delta))
      .sort((a, b) => a.delta - b.delta)[0];

    const CONSISTENT_CURR_MIN = 7;
    const CONSISTENT_DELTA_MAX = 0.5;
    const consistentCands = deltas
      .filter(
        (x) =>
          Number.isFinite(x.curr) &&
          Math.round(x.curr * 10) / 10 >= CONSISTENT_CURR_MIN &&
          Number.isFinite(x.delta) &&
          Math.abs(x.delta) <= CONSISTENT_DELTA_MAX
      )
      .sort((a, b) => b.curr - a.curr)
      .slice(0, 3);

    return {
      improving: improvingCand || null,
      watch: watchCand || null,
      consistent: consistentCands,
    };
  }, [items]);

  // helpers
  const pct = (v01: number) => `${Math.round(v01 * 100)}%`;
  const oneDecimal = (v10: number) =>
    `${(Math.round(v10 * 10) / 10).toFixed(1)}/10`;

  const containerWidth = Math.max(260, Math.min(420, width - 32));
  const chartOuterMargin = Math.min(
    48,
    Math.max(28, Math.round(containerWidth * 0.12))
  );
  const chartSize = Math.max(180, containerWidth - chartOuterMargin * 2);
  const labelFontSize = width < 360 ? 10 : 12;
  const labelLineHeight = width < 360 ? 12 : 16;
  const labelMaxChars = width < 360 ? 8 : 12;
  const labelMaxLines = width < 360 ? 3 : 2;

  return (
    <Screen style={{ padding: 16, backgroundColor: colors.bg }}>
      <PageHeader title="Insights" />
      {/* Overall Pitch Grade */}
      <Card
        style={{
          gap: 10,
          borderColor: colors.border,
          borderWidth: 1,
          alignItems: "center",
          paddingVertical: 16,
        }}
      >
        <View style={{ alignItems: "center", width: "100%" }}>
          <SectionTitle color={colors.fg}>Overall Pitch Grade</SectionTitle>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Text
            style={{ color: colors.accent, fontSize: 48, fontWeight: "900" }}
          >
            {avgScoreText}
          </Text>
          {avgScoreText !== "—" ? (
            <Text style={{ color: colors.fg, fontSize: 30, fontWeight: "700" }}>
              %
            </Text>
          ) : null}
        </View>
        <Text style={{ color: colors.muted, textAlign: "center" }}>
          {count
            ? `Based on ${count} recording${count === 1 ? "" : "s"}.`
            : "No recordings yet."}
        </Text>
      </Card>

      <View style={{ height: 16 }} />

      {/* Sales Personality 
      <Card
        style={{ gap: 8, borderColor: colors.border, borderWidth: 1 }}
      >
        <SectionTitle color={colors.fg}>Sales Personality</SectionTitle>
        <Text
          style={{
            color: colors.fg,
            fontSize: 18,
            fontWeight: "800",
            textAlign: "center",
            paddingTop: 4,
          }}
        >
          The Consultant
        </Text>
        <Text
          style={{ color: colors.muted, lineHeight: 20, textAlign: "center" }}
        >
          Builds rapport, asks open-ended questions, and tailors recommendations
          to the buyer’s stated pains. Emphasizes discovery, summarizes needs,
          and proposes clear next steps.
        </Text>
      </Card>

      <View style={{ height: 16 }} />
      */}

      {/* Skills Radar + Breakdown */}
      <Card
        style={{
          gap: 12,
          borderColor: colors.border,
          borderWidth: 1,
          alignItems: "center",
          paddingVertical: 16,
        }}
      >
        <SectionTitle color={colors.fg}>Skills Radar</SectionTitle>

        <View style={{ width: "100%", alignItems: "center", paddingTop: 8 }}>
          <RadarChart
            labels={labels}
            values={values01}
            size={chartSize}
            outerMargin={chartOuterMargin}
            labelRadius={1.08}
            labelFontSize={labelFontSize}
            labelLineHeight={labelLineHeight}
            labelMaxCharsPerLine={labelMaxChars}
            labelMaxLines={labelMaxLines}
            showRingPercents={false}
          />
        </View>

        {/* Divider */}
        <View
          style={{ height: 1, backgroundColor: colors.border, width: "100%" }}
        />

        {/* Attribute Breakdown */}
        <View style={{ width: "100%", marginTop: 8, paddingHorizontal: 8 }}>
          <SectionTitle color={colors.fg}>Overall Breakdown</SectionTitle>

          <View style={{ width: "100%" }}>
            {labels.map((lab, i) => {
              const youPctNum = Math.round(values01[i] * 100);
              const barColor =
                youPctNum >= 80
                  ? colors.accent
                  : youPctNum >= 60
                  ? "#E5C94D"
                  : youPctNum >= 40
                  ? "#E86A6A"
                  : "#E86A6A";
              return (
                <View
                  key={lab + i}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    borderRadius: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.muted, fontSize: 14 }}>
                      {lab}
                    </Text>
                    <Text
                      style={{
                        color: colors.onAccent,
                        backgroundColor: barColor,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 9999,
                        fontWeight: "800",
                        fontSize: 12,
                      }}
                    >
                      {youPctNum}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 9999,
                      backgroundColor: colors.border,
                      marginTop: 10,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${youPctNum}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Card>

      <View style={{ height: 16 }} />

      {/* Just commented out the whole recent trends code for the demo since it wasn't populating. Just remove beginning and ending comment signilars */}

      {/* Recent Trends 
      <Card
        style={{
          gap: 12,
          borderColor: colors.border,
          borderWidth: 1,
          paddingVertical: 16,
        }}
      >
        <SectionTitle color={colors.fg}>Recent Trends</SectionTitle>

        {/* Improving 
        <View
          style={{
            backgroundColor: "#0e0e0e",
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        >
          <Text
            style={{ color: colors.fg, fontWeight: "800", marginBottom: 6 }}
          >
            Improving
          </Text>
          {improving && Number.isFinite(improving.delta) ? (
            <Text style={{ color: colors.muted }}>
              {improving.label} • +
              {(Math.round(improving.delta * 10) / 10).toFixed(1)} (last vs
              prior)
            </Text>
          ) : (
            <Text style={{ color: colors.muted }}>Not enough data yet.</Text>
          )}
        </View>

        {/* Consistent 
        <View
          style={{
            backgroundColor: "#0e0e0e",
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        >
          <Text
            style={{ color: colors.fg, fontWeight: "800", marginBottom: 6 }}
          >
            Consistent
          </Text>
          {consistent && consistent.length ? (
            <View style={{ gap: 4 }}>
              {consistent.map((c) => (
                <Text key={c.label} style={{ color: colors.muted }}>
                  {c.label} • {(Math.round(c.curr * 10) / 10).toFixed(1)}{" "}
                  (steady)
                </Text>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted }}>
              No stable high performers yet.
            </Text>
          )}
        </View>

        {/* Watch *
        <View
          style={{
            backgroundColor: "#0e0e0e",
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
          }}
        >
          <Text
            style={{ color: colors.fg, fontWeight: "800", marginBottom: 6 }}
          >
            Watch
          </Text>
          {watch && Number.isFinite(watch.delta) ? (
            <Text style={{ color: colors.muted }}>
              {watch.label} • {(Math.round(watch.delta * 10) / 10).toFixed(1)}{" "}
              (drop)
            </Text>
          ) : (
            <Text style={{ color: colors.muted }}>
              No significant declines detected.
            </Text>
          )}
        </View>
      </Card> */}
    </Screen>
  );
}
