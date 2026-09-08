import * as React from "react";

/**
 * Catalogue tile for one tool. The portal home is a grid of these.
 * @startingPoint section="Tools" subtitle="Tool catalogue tile" viewport="700x220"
 */
export interface ToolCardProps {
  /** 22px Icon node. */
  icon?: React.ReactNode;
  title: string;
  description: string;
  /** Category line, bottom-left. */
  category?: string;
  /** Mono shortcut hint, bottom-right. */
  shortcut?: string;
  /** @default false */
  isNew?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function ToolCard(props: ToolCardProps): JSX.Element;
