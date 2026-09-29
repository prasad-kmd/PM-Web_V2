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
import {
  getReaderMetrics,
  formatPixels,
  pixelsToReaderSetting,
} from "@/lib/accessibility/reader-metrics";
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
}> = [
  {
    key: "fontSize",
    label: "Text size",
    icon: Type,
    min: 12,
    max: 24,
  },
  {
    key: "lineHeight",
    label: "Line spacing",
    icon: AlignLeft,
    min: 18,
    max: 60,
  },
  {
    key: "wordSpacing",
    label: "Word spacing",
    icon: List,
    min: -2,
    max: 12,
  },
  {
    key: "letterSpacing",
    label: "Letter spacing",
    icon: LetterText,
    min: -1,
    max: 4,
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
      className="flex items-center gap-1.5 text-[11px] font-medium text-ink"
    >
      <Icon aria-hidden="true" className="size-3.5" />
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

  const pixels = getReaderMetrics(values);

  return (
    <DialogPopup
      from="bottom"
      className="max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto border-border bg-card p-0 gap-0 sm:max-w-[22rem]"
    >
      <DialogHeader className="flex flex-col gap-1 border-b border-border px-4 py-3 pr-10 text-left">
        <DialogTitle className="font-sans text-sm font-semibold text-ink">
          Reading options
        </DialogTitle>
        <DialogDescription className="text-[11px] leading-4 text-ink-soft">
          Adjust the reading view.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3.5 px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <SectionLabel id={typefaceLabelId} icon={Type}>
            Typeface
          </SectionLabel>
          <Select
            value={fontFamily}
            onValueChange={(value) => updateSetting("fontFamily", value)}
          >
            <SelectTrigger
              aria-labelledby={typefaceLabelId}
              className="h-8 min-h-8 w-full border-ink-soft/60 bg-muted/40 text-xs"
            >
              <SelectValue placeholder="Select a reading font" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {READER_FONTS.map((font) => (
                  <SelectItem
                    key={font.name}
                    value={font.name}
                    className="min-h-8 text-xs"
                  >
                    {font.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-2 min-[400px]:grid-cols-2">
          {SLIDERS.map(({ key, label, icon, min, max }) => {
            const value = pixels[key];
            return (
              <div key={key} className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5">
                  <SectionLabel icon={icon}>{label}</SectionLabel>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary tabular-nums">
                    {formatPixels(pixels[key])}
                  </span>
                </div>
                <Slider
                  className="min-h-7 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-4"
                  aria-label={label}
                  aria-valuetext={formatPixels(pixels[key])}
                  value={[value]}
                  min={Math.min(min, Math.floor(value))}
                  max={Math.max(max, Math.ceil(value))}
                  step={1}
                  onValueChange={([next]) => {
                    if (next !== undefined) {
                      updateSetting(
                        key,
                        pixelsToReaderSetting(key, next, pixels.fontSize),
                      );
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        <p className="text-[11px] leading-4 text-ink-soft">
          1 px per step. Word and letter spacing add extra gaps.
        </p>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-0.5">
            <SectionLabel id={contrastLabelId} icon={Contrast}>
              High contrast
            </SectionLabel>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] font-medium text-ink">
              {isHighContrast ? "On" : "Off"}
            </span>
            <Switch
              size="sm"
              aria-labelledby={contrastLabelId}
              checked={isHighContrast}
              onCheckedChange={(checked) =>
                updateSetting("isHighContrast", checked)
              }
            />
          </div>
        </div>
      </div>

      <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border px-4 py-2 sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetAllSettings}
          className="h-8 min-h-8 text-[11px]"
        >
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          Reset
        </Button>
        <DialogClose
          render={
            <Button type="button" size="sm" className="h-8 min-h-8 text-[11px]">
              Done
            </Button>
          }
        />
      </DialogFooter>
    </DialogPopup>
  );
}
