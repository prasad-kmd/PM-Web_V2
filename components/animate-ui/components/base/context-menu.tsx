import * as React from 'react';

import {
  ContextMenu as ContextMenuPrimitive,
  ContextMenuTrigger as ContextMenuTriggerPrimitive,
  ContextMenuPortal as ContextMenuPortalPrimitive,
  ContextMenuPopup as ContextMenuPopupPrimitive,
  ContextMenuPositioner as ContextMenuPositionerPrimitive,
  ContextMenuGroup as ContextMenuGroupPrimitive,
  ContextMenuGroupLabel as ContextMenuGroupLabelPrimitive,
  ContextMenuItem as ContextMenuItemPrimitive,
  ContextMenuHighlightItem as ContextMenuHighlightItemPrimitive,
  ContextMenuHighlight as ContextMenuHighlightPrimitive,
  ContextMenuSeparator as ContextMenuSeparatorPrimitive,
  type ContextMenuProps as ContextMenuPrimitiveProps,
  type ContextMenuTriggerProps as ContextMenuTriggerPrimitiveProps,
  type ContextMenuPortalProps as ContextMenuPortalPrimitiveProps,
  type ContextMenuPopupProps as ContextMenuPopupPrimitiveProps,
  type ContextMenuPositionerProps as ContextMenuPositionerPrimitiveProps,
  type ContextMenuGroupProps as ContextMenuGroupPrimitiveProps,
  type ContextMenuGroupLabelProps as ContextMenuGroupLabelPrimitiveProps,
  type ContextMenuItemProps as ContextMenuItemPrimitiveProps,
  type ContextMenuSeparatorProps as ContextMenuSeparatorPrimitiveProps,
} from '@/components/animate-ui/primitives/base/context-menu';
import { cn } from '@/lib/utils';

type ContextMenuProps = ContextMenuPrimitiveProps;

function ContextMenu(props: ContextMenuProps) {
  return <ContextMenuPrimitive {...props} />;
}

type ContextMenuTriggerProps = ContextMenuTriggerPrimitiveProps;

function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  return <ContextMenuTriggerPrimitive {...props} />;
}

type ContextMenuPortalProps = ContextMenuPortalPrimitiveProps;

function ContextMenuPortal(props: ContextMenuPortalProps) {
  return <ContextMenuPortalPrimitive {...props} />;
}

type ContextMenuPanelProps = ContextMenuPopupPrimitiveProps & ContextMenuPositionerPrimitiveProps;

function ContextMenuPanel({
  className,
  finalFocus,
  id,
  children,
  sideOffset = 4,
  transition = { duration: 0.2 },
  ...props
}: ContextMenuPanelProps) {
  return (
    <ContextMenuPortal>
      <ContextMenuPositionerPrimitive className="z-50" sideOffset={sideOffset} {...props}>
        <ContextMenuPopupPrimitive
          finalFocus={finalFocus}
          transition={transition}
          id={id}
          className={cn(
            'bg-popover text-popover-foreground min-w-[14rem] origin-(--transform-origin) overflow-hidden rounded-xl border p-1 shadow-lg outline-none',
            className,
          )}
        >
          <ContextMenuHighlightPrimitive className="absolute inset-0 bg-accent z-0 rounded-[10px]">
            {children}
          </ContextMenuHighlightPrimitive>
        </ContextMenuPopupPrimitive>
      </ContextMenuPositionerPrimitive>
    </ContextMenuPortal>
  );
}

type ContextMenuGroupProps = ContextMenuGroupPrimitiveProps;

function ContextMenuGroup(props: ContextMenuGroupProps) {
  return <ContextMenuGroupPrimitive {...props} />;
}

type ContextMenuGroupLabelProps = ContextMenuGroupLabelPrimitiveProps & {
  inset?: boolean;
};

function ContextMenuGroupLabel({ className, inset, ...props }: ContextMenuGroupLabelProps) {
  return (
    <ContextMenuGroupLabelPrimitive
      data-inset={inset}
      className={cn('px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase data-[inset]:pl-8', className)}
      {...props}
    />
  );
}

type ContextMenuItemProps = ContextMenuItemPrimitiveProps & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
};

function ContextMenuItem({ className, inset, variant = 'default', disabled, ...props }: ContextMenuItemProps) {
  return (
    <ContextMenuHighlightItemPrimitive
      activeClassName={variant === 'destructive' ? 'bg-destructive/10 dark:bg-destructive/20' : ''}
      disabled={disabled}
    >
      <ContextMenuItemPrimitive
        disabled={disabled}
        data-inset={inset}
        data-variant={variant}
        className={cn(
          "focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        {...props}
      />
    </ContextMenuHighlightItemPrimitive>
  );
}

type ContextMenuSeparatorProps = ContextMenuSeparatorPrimitiveProps;

function ContextMenuSeparator({ className, ...props }: ContextMenuSeparatorProps) {
  return <ContextMenuSeparatorPrimitive className={cn('bg-border -mx-1 my-1 h-px', className)} {...props} />;
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuPanel,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuSeparator,
  type ContextMenuProps,
  type ContextMenuTriggerProps,
  type ContextMenuPortalProps,
  type ContextMenuPanelProps,
  type ContextMenuGroupProps,
  type ContextMenuGroupLabelProps,
  type ContextMenuItemProps,
  type ContextMenuSeparatorProps,
};
