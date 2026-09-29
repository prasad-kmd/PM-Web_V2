"use client";

import {
  AlignLeft,
  Contrast,
  LetterText,
  List,
  RotateCcw,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useId, type ReactNode } from "react";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/animate-ui/components/base/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  READER_FONTS,
  useAccessibility,
} from "@/contexts/AccessibilityContext";

/** The reading preferences that are adjusted with a slider. */
type SliderKey = "fontSize" | "lineHeight" | "wordSpacing" | "letterSpacing";

const SLIDERS: Array<{
  key: SliderKey;
  label: string;
  icon: LucideIcon;
  min: number;
  max: number;
  step: number;
  /** How the current value reads in the badge next to the label. */
  format: (value: number) => string;
}> = [
  {
    key: "fontSize",
    label: "Text size",
    icon: Type,
    min: 0.85,
    max: 1.5,
    step: 0.05,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: "lineHeight",
    label: "Line spacing",
    icon: AlignLeft,
    min: 1,
    max: 1.4,
    step: 0.05,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: "wordSpacing",
    label: "Word spacing",
    icon: List,
    min: 0.8,
    max: 1.5,
    step: 0.05,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: "letterSpacing",
    label: "Letter spacing",
    icon: LetterText,
    min: 0.9,
    max: 1.3,
    step: 0.05,
    format: (value) => `${Math.round(value * 100)}%`,
  },
];

function SectionLabel({
  id,
  icon: Icon,
  children,
}: {
  id?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Label
      id={id}
      className="flex items-center gap-2 font-mono text-[10px] font-black tracking-[0.2em] text-ink-soft uppercase"
    >
      <Icon aria-hidden="true" className="size-3" />
      {children}
    </Label>
  );
}

/**
 * Contents of the reading options dialog: typography, spacing and contrast
 * controls that write straight into `AccessibilityContext`.
 */
export function ControlPanel() {
  const {
    updateSetting,
    resetAllSettings,
    fontSize,
    fontFamily,
    lineHeight,
    wordSpacing,
    letterSpacing,
    isHighContrast,
  } = useAccessibility();

  const typefaceLabelId = useId();
  const contrastLabelId = useId();
  const values: Record<SliderKey, number> = {
    fontSize,
    lineHeight,
    wordSpacing,
    letterSpacing,
  };

  return (
    <DialogPopup
      from="bottom"
      className="max-h-[min(85dvh,40rem)] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto border-border bg-card p-0 sm:max-w-md"
    >
      <DialogHeader className="flex flex-col gap-1 border-b border-border px-5 py-4 text-left">
        <DialogTitle className="font-sans text-base font-semibold text-ink">
          Reading options
        </DialogTitle>
        <DialogDescription className="font-mono text-[10px] tracking-[0.16em] text-ink-soft uppercase">
          Applies to articles, tutorials and project write-ups
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-6 px-5 py-5">
        <div className="flex flex-col gap-2.5">
          <SectionLabel id={typefaceLabelId} icon={Type}>
            Typeface
          </SectionLabel>
          <Select
            value={fontFamily}
            onValueChange={(value) => updateSetting("fontFamily", value)}
          >
            <SelectTrigger
              aria-labelledby={typefaceLabelId}
              className="h-9 w-full border-border bg-muted/40 font-mono text-xs"
            >
              <SelectValue placeholder="Select a reading font" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {READER_FONTS.map((font) => (
                  <SelectItem
                    key={font.name}
                    value={font.name}
                    className="text-xs"
                  >
                    {font.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {SLIDERS.map(({ key, label, icon, min, max, step, format }) => {
            const value = values[key];
            return (
              <div key={key} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel icon={icon}>{label}</SectionLabel>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-black text-primary tabular-nums">
                    {format(value)}
                  </span>
                </div>
                <Slider
                  aria-label={label}
                  value={[value]}
                  min={min}
                  max={max}
                  step={step}
                  onValueChange={([next]) => updateSetting(key, next)}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <div className="flex flex-col gap-0.5">
            <SectionLabel id={contrastLabelId} icon={Contrast}>
              High contrast text
            </SectionLabel>
            <p className="text-[11px] leading-4 text-ink-soft">
              Maximise text-to-background contrast while reading
            </p>
          </div>
          <Switch
            aria-labelledby={contrastLabelId}
            checked={isHighContrast}
            onCheckedChange={(checked) =>
              updateSetting("isHighContrast", checked)
            }
          />
        </div>
      </div>

      <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border px-5 py-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetAllSettings}
          className="font-mono text-[10px] tracking-[0.14em] uppercase"
        >
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          Reset
        </Button>
        <DialogClose
          render={
            <Button
              type="button"
              size="sm"
              className="font-mono text-[10px] tracking-[0.14em] uppercase"
            >
              Done
            </Button>
          }
        />
      </DialogFooter>
    </DialogPopup>
  );
}
