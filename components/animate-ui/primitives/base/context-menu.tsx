'use client';

import * as React from 'react';
import { ContextMenu as ContextMenuPrimitive } from '@base-ui-components/react/context-menu';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';

import {
  Highlight,
  HighlightItem,
  type HighlightItemProps,
  type HighlightProps,
} from '@/components/animate-ui/primitives/effects/highlight';
import { getStrictContext } from '@/lib/get-strict-context';
import { useControlledState } from '@/hooks/use-controlled-state';
import { useDataState } from '@/hooks/use-data-state';

type ContextMenuActiveValueContextType = {
  highlightedValue: string | null;
  setHighlightedValue: (value: string | null) => void;
};

type ContextMenuContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const [ContextMenuActiveValueProvider, useContextMenuActiveValue] =
  getStrictContext<ContextMenuActiveValueContextType>('ContextMenuActiveValueContext');
const [ContextMenuProvider, useContextMenu] =
  getStrictContext<ContextMenuContextType>('ContextMenuContext');

type ContextMenuProps = React.ComponentProps<typeof ContextMenuPrimitive.Root>;

function ContextMenu(props: ContextMenuProps) {
  const [isOpen, setIsOpen] = useControlledState({
    value: props?.open,
    defaultValue: props?.defaultOpen,
    onChange: props?.onOpenChange,
  });
  const [highlightedValue, setHighlightedValue] = React.useState<string | null>(null);

  return (
    <ContextMenuActiveValueProvider value={{ highlightedValue, setHighlightedValue }}>
      <ContextMenuProvider value={{ isOpen, setIsOpen }}>
        <ContextMenuPrimitive.Root data-slot="context-menu" {...props} onOpenChange={setIsOpen} />
      </ContextMenuProvider>
    </ContextMenuActiveValueProvider>
  );
}

type ContextMenuTriggerProps = React.ComponentProps<typeof ContextMenuPrimitive.Trigger>;

function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

type ContextMenuPortalProps = Omit<React.ComponentProps<typeof ContextMenuPrimitive.Portal>, 'keepMounted'>;

function ContextMenuPortal(props: ContextMenuPortalProps) {
  const { isOpen } = useContextMenu();
  return (
    <AnimatePresence>
      {isOpen && <ContextMenuPrimitive.Portal keepMounted data-slot="context-menu-portal" {...props} />}
    </AnimatePresence>
  );
}

type ContextMenuPositionerProps = React.ComponentProps<typeof ContextMenuPrimitive.Positioner>;

function ContextMenuPositioner(props: ContextMenuPositionerProps) {
  return <ContextMenuPrimitive.Positioner data-slot="context-menu-positioner" {...props} />;
}

type ContextMenuPopupProps = Omit<React.ComponentProps<typeof ContextMenuPrimitive.Popup>, 'render'> &
  HTMLMotionProps<'div'>;

function ContextMenuPopup({
  finalFocus,
  id,
  transition = { duration: 0.2 },
  style,
  ...props
}: ContextMenuPopupProps) {
  return (
    <ContextMenuPrimitive.Popup
      finalFocus={finalFocus}
      id={id}
      render={
        <motion.div
          key="context-menu-popup"
          data-slot="context-menu-popup"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={transition}
          style={{ willChange: 'opacity, transform', ...style }}
          {...props}
        />
      }
    />
  );
}

type ContextMenuHighlightProps = Omit<HighlightProps, 'controlledItems' | 'enabled' | 'hover'> & {
  animateOnHover?: boolean;
};

function ContextMenuHighlight({
  transition = { type: 'spring', stiffness: 350, damping: 35 },
  ...props
}: ContextMenuHighlightProps) {
  const { highlightedValue } = useContextMenuActiveValue();
  return (
    <Highlight
      data-slot="context-menu-highlight"
      click={false}
      controlledItems
      transition={transition}
      value={highlightedValue}
      {...props}
    />
  );
}

type ContextMenuHighlightItemProps = HighlightItemProps;

function ContextMenuHighlightItem(props: ContextMenuHighlightItemProps) {
  return <HighlightItem data-slot="context-menu-highlight-item" {...props} />;
}

type ContextMenuItemProps = Omit<React.ComponentProps<typeof ContextMenuPrimitive.Item>, 'render'> &
  HTMLMotionProps<'div'>;

function ContextMenuItem({ disabled, label, closeOnClick, nativeButton, id, ...props }: ContextMenuItemProps) {
  const { setHighlightedValue } = useContextMenuActiveValue();
  const [, highlightedRef] = useDataState<HTMLDivElement>('highlighted', undefined, (value) => {
    if (value === true) {
      const el = highlightedRef.current;
      const v = el?.dataset.value || el?.id || null;
      if (v) setHighlightedValue(v);
    }
  });

  return (
    <ContextMenuPrimitive.Item
      ref={highlightedRef}
      label={label}
      closeOnClick={closeOnClick}
      nativeButton={nativeButton}
      disabled={disabled}
      id={id}
      data-slot="context-menu-item"
      {...props}
    />
  );
}

type ContextMenuSeparatorProps = React.ComponentProps<typeof ContextMenuPrimitive.Separator>;

function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
  return <ContextMenuPrimitive.Separator data-slot="context-menu-separator" {...props} />;
}

type ContextMenuGroupProps = React.ComponentProps<typeof ContextMenuPrimitive.Group>;

function ContextMenuGroup(props: ContextMenuGroupProps) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

type ContextMenuGroupLabelProps = React.ComponentProps<typeof ContextMenuPrimitive.GroupLabel>;

function ContextMenuGroupLabel(props: ContextMenuGroupLabelProps) {
  return <ContextMenuPrimitive.GroupLabel data-slot="context-menu-group-label" {...props} />;
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuPopup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuHighlight,
  ContextMenuHighlightItem,
  useContextMenuActiveValue,
  useContextMenu,
  type ContextMenuProps,
  type ContextMenuTriggerProps,
  type ContextMenuPortalProps,
  type ContextMenuPositionerProps,
  type ContextMenuPopupProps,
  type ContextMenuItemProps,
  type ContextMenuSeparatorProps,
};
