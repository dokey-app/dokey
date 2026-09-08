/* @ds-bundle: {"format":4,"namespace":"ToolBoxDesignSystem_88556c","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Kbd","sourcePath":"components/core/Kbd.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/RadioGroup.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"CodePane","sourcePath":"components/tools/CodePane.jsx"},{"name":"CopyButton","sourcePath":"components/tools/CopyButton.jsx"},{"name":"Icon","sourcePath":"components/tools/Icon.jsx"},{"name":"ToolCard","sourcePath":"components/tools/ToolCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"cc5db923f766","components/core/Button.jsx":"b092dd0c346f","components/core/Card.jsx":"f76f249c0e55","components/core/IconButton.jsx":"e81ca75a039b","components/core/Kbd.jsx":"b816fd98c4a9","components/core/Tag.jsx":"4ebd020b34e4","components/feedback/Dialog.jsx":"86fa7dadebd8","components/feedback/EmptyState.jsx":"2fa0342463c1","components/feedback/Toast.jsx":"ccab755139a3","components/feedback/Tooltip.jsx":"f1abac4c712f","components/forms/Checkbox.jsx":"b9bc6134d4c8","components/forms/Input.jsx":"4e8b01e549f8","components/forms/RadioGroup.jsx":"04c90e93ce08","components/forms/Select.jsx":"2bb6d22c90fe","components/forms/Switch.jsx":"7c6a0c2090ae","components/forms/Textarea.jsx":"f1201b1a6d85","components/navigation/Breadcrumbs.jsx":"445414321e92","components/navigation/Tabs.jsx":"b426ef935ef2","components/tools/CodePane.jsx":"28a188bc0410","components/tools/CopyButton.jsx":"98d0a020bfcd","components/tools/Icon.jsx":"e95c4538e062","components/tools/ToolCard.jsx":"ffbd8a411045","ui_kits/mobile/MobileApp.jsx":"10402bc19afc","ui_kits/mobile/PhoneFrame.jsx":"4e4f7f402a74","ui_kits/portal/App.jsx":"015b18db05a7","ui_kits/portal/AppShell.jsx":"b6c6500a7892","ui_kits/portal/Base64Screen.jsx":"5200e894adeb","ui_kits/portal/CatalogScreen.jsx":"59adef8493c1","ui_kits/portal/JwtDecoderScreen.jsx":"8fcb9ef4190c","ui_kits/portal/tools.data.jsx":"7e43e7cbc7c0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ToolBoxDesignSystem_88556c = window.ToolBoxDesignSystem_88556c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  neutral: {
    background: "var(--surface-sunken)",
    color: "var(--text-muted)",
    border: "var(--border-subtle)"
  },
  accent: {
    background: "var(--surface-accent-soft)",
    color: "var(--text-accent)",
    border: "transparent"
  },
  success: {
    background: "var(--green-100)",
    color: "var(--text-success)",
    border: "transparent"
  },
  warning: {
    background: "var(--amber-100)",
    color: "var(--text-warning)",
    border: "transparent"
  },
  danger: {
    background: "var(--red-100)",
    color: "var(--text-danger)",
    border: "transparent"
  }
};
function Badge({
  tone = "neutral",
  mono = false,
  dot = false,
  style,
  children,
  ...rest
}) {
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      height: 22,
      padding: "0 8px",
      borderRadius: "var(--radius-sm)",
      background: t.background,
      color: t.color,
      border: `1px solid ${t.border}`,
      font: mono ? "var(--type-code-sm)" : "var(--type-label)",
      letterSpacing: mono ? 0 : "var(--tracking-snug)",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "999px",
      background: "currentColor"
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: {
    height: "var(--control-height-sm)",
    padding: "0 var(--control-pad-x-sm)",
    fontSize: "var(--text-xs)",
    gap: "6px",
    radius: "var(--radius-sm)"
  },
  md: {
    height: "var(--control-height-md)",
    padding: "0 var(--control-pad-x-md)",
    fontSize: "var(--text-sm)",
    gap: "8px",
    radius: "var(--radius-md)"
  },
  lg: {
    height: "var(--control-height-lg)",
    padding: "0 var(--control-pad-x-lg)",
    fontSize: "var(--text-base)",
    gap: "8px",
    radius: "var(--radius-md)"
  }
};
const variants = {
  primary: {
    rest: {
      background: "var(--action-primary)",
      color: "var(--text-on-accent)",
      border: "1px solid transparent",
      boxShadow: "var(--shadow-xs)"
    },
    hover: {
      background: "var(--action-primary-hover)"
    },
    active: {
      background: "var(--action-primary-active)"
    }
  },
  secondary: {
    rest: {
      background: "var(--surface-card)",
      color: "var(--text-strong)",
      border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-xs)"
    },
    hover: {
      background: "var(--surface-hover)"
    },
    active: {
      background: "var(--surface-active)"
    }
  },
  ghost: {
    rest: {
      background: "transparent",
      color: "var(--text-body)",
      border: "1px solid transparent"
    },
    hover: {
      background: "var(--surface-hover)",
      color: "var(--text-strong)"
    },
    active: {
      background: "var(--surface-active)"
    }
  },
  soft: {
    rest: {
      background: "var(--surface-accent-soft)",
      color: "var(--text-accent)",
      border: "1px solid transparent"
    },
    hover: {
      background: "var(--accent-100)"
    },
    active: {
      background: "var(--accent-200)"
    }
  },
  danger: {
    rest: {
      background: "var(--action-danger)",
      color: "#fff",
      border: "1px solid transparent",
      boxShadow: "var(--shadow-xs)"
    },
    hover: {
      background: "var(--action-danger-hover)"
    },
    active: {
      background: "var(--red-600)"
    }
  }
};
function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  type = "button",
  style,
  children,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: s.height,
    padding: s.padding,
    gap: s.gap,
    font: "var(--type-ui)",
    fontSize: s.fontSize,
    letterSpacing: "var(--tracking-snug)",
    borderRadius: s.radius,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : undefined,
    transition: "var(--transition-control), transform var(--duration-instant) var(--ease-standard)",
    transform: press && !disabled ? "translateY(0.5px)" : "none",
    ...v.rest,
    ...(hover && !disabled ? v.hover : null),
    ...(press && !disabled ? v.active : null),
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    style: base,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false)
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  padding = "var(--card-pad)",
  interactive = false,
  elevated = false,
  header,
  footer,
  style,
  children,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-xl)",
      boxShadow: elevated ? "var(--shadow-md)" : "var(--shadow-xs)",
      transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)",
      ...(interactive && hover ? {
        borderColor: "var(--accent-300)",
        boxShadow: "var(--shadow-md)",
        transform: "translateY(-1px)"
      } : null),
      cursor: interactive ? "pointer" : "default",
      overflow: "hidden",
      ...style
    }
  }, rest), header && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px var(--space-4)",
      borderBottom: "1px solid var(--border-subtle)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      font: "var(--type-ui)",
      color: "var(--text-strong)"
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      padding
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px var(--space-4)",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-sunken)",
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, footer));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: 28,
  md: 34,
  lg: 40
};
function IconButton({
  size = "md",
  variant = "ghost",
  label,
  disabled = false,
  active = false,
  style,
  children,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const px = sizes[size] || sizes.md;
  const tone = {
    ghost: {
      background: active ? "var(--surface-active)" : "transparent",
      border: "1px solid transparent",
      color: "var(--text-muted)"
    },
    secondary: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      color: "var(--text-body)"
    },
    soft: {
      background: "var(--surface-accent-soft)",
      border: "1px solid transparent",
      color: "var(--text-accent)"
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: px,
      height: px,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition: "var(--transition-control)",
      ...tone,
      ...(hover && !disabled ? {
        background: variant === "soft" ? "var(--accent-100)" : "var(--surface-hover)",
        color: "var(--text-strong)"
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Kbd.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Kbd({
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("kbd", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 20,
      height: 20,
      padding: "0 5px",
      font: "var(--type-code-sm)",
      color: "var(--text-muted)",
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderBottomWidth: 2,
      borderRadius: "var(--radius-xs)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Kbd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Kbd.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  selected = false,
  onRemove,
  interactive = false,
  style,
  children,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 26,
      padding: "0 10px",
      borderRadius: "var(--radius-pill)",
      font: "var(--type-ui)",
      fontSize: "var(--text-xs)",
      cursor: interactive || onRemove ? "pointer" : "default",
      transition: "var(--transition-control)",
      background: selected ? "var(--surface-accent-soft)" : hover && interactive ? "var(--surface-hover)" : "transparent",
      color: selected ? "var(--text-accent)" : "var(--text-muted)",
      border: `1px solid ${selected ? "var(--accent-300)" : "var(--border-subtle)"}`,
      ...style
    }
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      opacity: 0.6,
      fontSize: 13,
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = false,
  onClose,
  title,
  description,
  footer,
  width = 460,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 50,
      background: "var(--surface-overlay)",
      backdropFilter: "blur(2px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: "100%",
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-2xl)",
      boxShadow: "var(--shadow-lg)",
      overflow: "hidden",
      animation: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5) var(--space-5) var(--space-3)"
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-h3)",
      color: "var(--text-strong)",
      letterSpacing: "var(--tracking-snug)"
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      font: "var(--type-ui)",
      fontWeight: 400,
      color: "var(--text-muted)"
    }
  }, description)), children && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 var(--space-5) var(--space-5)"
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: "var(--space-3) var(--space-5)",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-sunken)"
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      textAlign: "center",
      padding: compact ? "var(--space-6)" : "var(--space-12) var(--space-6)",
      color: "var(--text-muted)",
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-subtle)",
      display: "flex"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-ui)",
      fontSize: "var(--text-base)",
      color: "var(--text-strong)"
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-caption)",
      maxWidth: 340
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const tones = {
  neutral: {
    border: "var(--border-default)",
    accent: "var(--text-muted)"
  },
  success: {
    border: "var(--border-subtle)",
    accent: "var(--text-success)"
  },
  danger: {
    border: "var(--border-subtle)",
    accent: "var(--text-danger)"
  },
  warning: {
    border: "var(--border-subtle)",
    accent: "var(--text-warning)"
  }
};
function Toast({
  tone = "neutral",
  title,
  description,
  icon,
  action,
  onClose,
  style
}) {
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      width: 340,
      maxWidth: "100%",
      padding: "12px 14px",
      background: "var(--surface-card)",
      border: `1px solid ${t.border}`,
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-md)",
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.accent,
      display: "flex",
      marginTop: 1
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-ui)",
      color: "var(--text-strong)"
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2,
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, description)), action, onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-subtle)",
      fontSize: 15,
      lineHeight: 1,
      padding: 0
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  side = "top",
  children,
  style
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: "calc(100% + 6px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    bottom: {
      top: "calc(100% + 6px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    left: {
      right: "calc(100% + 6px)",
      top: "50%",
      transform: "translateY(-50%)"
    },
    right: {
      left: "calc(100% + 6px)",
      top: "50%",
      transform: "translateY(-50%)"
    }
  }[side];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, children, show && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      zIndex: 40,
      ...pos,
      whiteSpace: "nowrap",
      padding: "5px 8px",
      borderRadius: "var(--radius-sm)",
      background: "var(--gray-900)",
      color: "var(--gray-0)",
      font: "var(--type-caption)",
      boxShadow: "var(--shadow-md)",
      pointerEvents: "none"
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  const [inner, setInner] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : inner;
  const toggle = e => {
    if (disabled) return;
    if (!isControlled) setInner(!on);
    onChange && onChange(!on, e);
  };
  return /*#__PURE__*/React.createElement("label", _extends({
    onClick: toggle,
    style: {
      display: "inline-flex",
      gap: 10,
      alignItems: description ? "flex-start" : "center",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      flex: "0 0 16px",
      marginTop: description ? 2 : 0,
      borderRadius: "var(--radius-xs)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: on ? "var(--action-primary)" : "var(--surface-card)",
      border: `1px solid ${on ? "var(--action-primary)" : "var(--border-default)"}`,
      transition: "var(--transition-control)"
    }
  }, on && /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 6.3 4.6 9 10 3"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-ui)",
      color: "var(--text-body)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const heights = {
  sm: "var(--control-height-sm)",
  md: "var(--control-height-md)",
  lg: "var(--control-height-lg)"
};
function Input({
  label,
  hint,
  error,
  size = "md",
  mono = false,
  prefix,
  suffix,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "in";
  const inputId = id || autoId;
  const invalid = Boolean(error);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      width: "100%"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      font: "var(--type-label)",
      color: "var(--text-body)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: heights[size],
      padding: "0 10px",
      background: "var(--surface-card)",
      border: `1px solid ${invalid ? "var(--border-danger)" : focus ? "var(--border-accent)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-md)",
      boxShadow: focus ? invalid ? "var(--ring-danger)" : "var(--ring-focus)" : "none",
      transition: "var(--transition-control)",
      ...style
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-subtle)",
      display: "flex"
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      color: "var(--text-strong)",
      font: mono ? "var(--type-code)" : "var(--type-ui)"
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-subtle)",
      display: "flex"
    }
  }, suffix)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: invalid ? "var(--text-danger)" : "var(--text-muted)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioGroup.jsx
try { (() => {
function RadioGroup({
  name,
  options = [],
  value,
  defaultValue,
  onChange,
  direction = "column",
  style
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;
  const pick = v => {
    if (!isControlled) setInner(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: "flex",
      flexDirection: direction,
      gap: direction === "row" ? 16 : 10,
      ...style
    }
  }, options.map(o => {
    const v = typeof o === "string" ? o : o.value;
    const lbl = typeof o === "string" ? o : o.label;
    const on = current === v;
    return /*#__PURE__*/React.createElement("label", {
      key: v,
      onClick: () => pick(v),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 16,
        height: 16,
        borderRadius: "999px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${on ? "var(--action-primary)" : "var(--border-default)"}`,
        background: "var(--surface-card)",
        transition: "var(--transition-control)"
      }
    }, on && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: "999px",
        background: "var(--action-primary)"
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-ui)",
        color: "var(--text-body)"
      }
    }, lbl), /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      value: v,
      checked: on,
      readOnly: true,
      style: {
        display: "none"
      }
    }));
  }));
}
Object.assign(__ds_scope, { RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const heights = {
  sm: "var(--control-height-sm)",
  md: "var(--control-height-md)",
  lg: "var(--control-height-lg)"
};
function Select({
  label,
  hint,
  options = [],
  size = "md",
  style,
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "sel";
  const selId = id || autoId;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: selId,
    style: {
      font: "var(--type-label)",
      color: "var(--text-body)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selId,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: "none",
      width: "100%",
      height: heights[size],
      padding: "0 30px 0 10px",
      font: "var(--type-ui)",
      color: "var(--text-strong)",
      background: "var(--surface-card)",
      border: `1px solid ${focus ? "var(--border-accent)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-md)",
      outline: "none",
      boxShadow: focus ? "var(--ring-focus)" : "none",
      transition: "var(--transition-control)",
      cursor: "pointer",
      ...style
    }
  }, rest), options.map(o => {
    const value = typeof o === "string" ? o : o.value;
    const lbl = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: value,
      value: value
    }, lbl);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 10,
      pointerEvents: "none",
      color: "var(--text-subtle)",
      fontSize: 10
    }
  }, "\u25BE")), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style
}) {
  const [inner, setInner] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : inner;
  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInner(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    onClick: toggle,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "switch",
    "aria-checked": on,
    style: {
      width: 34,
      height: 20,
      borderRadius: "999px",
      padding: 2,
      display: "inline-flex",
      background: on ? "var(--action-primary)" : "var(--gray-300)",
      transition: "background-color var(--duration-fast) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: "999px",
      background: "#fff",
      boxShadow: "var(--shadow-xs)",
      transform: on ? "translateX(14px)" : "translateX(0)",
      transition: "transform var(--duration-fast) var(--ease-out)"
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-ui)",
      color: "var(--text-body)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  label,
  hint,
  error,
  mono = true,
  rows = 6,
  resize = "vertical",
  style,
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "ta";
  const taId = id || autoId;
  const invalid = Boolean(error);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      width: "100%"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: taId,
    style: {
      font: "var(--type-label)",
      color: "var(--text-body)"
    }
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: taId,
    rows: rows,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      padding: "10px 12px",
      resize,
      background: "var(--surface-card)",
      color: "var(--text-strong)",
      font: mono ? "var(--type-code)" : "var(--type-body)",
      border: `1px solid ${invalid ? "var(--border-danger)" : focus ? "var(--border-accent)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-md)",
      outline: "none",
      boxShadow: focus ? invalid ? "var(--ring-danger)" : "var(--ring-focus)" : "none",
      transition: "var(--transition-control)",
      ...style
    }
  }, rest)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: invalid ? "var(--text-danger)" : "var(--text-muted)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
function Breadcrumbs({
  items = [],
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "breadcrumb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      font: "var(--type-ui)",
      fontSize: "var(--text-xs)",
      ...style
    }
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    const label = typeof it === "string" ? it : it.label;
    const href = typeof it === "string" ? undefined : it.href;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: label
    }, last || !href ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: last ? "var(--text-strong)" : "var(--text-muted)"
      }
    }, label) : /*#__PURE__*/React.createElement("a", {
      href: href,
      style: {
        color: "var(--text-muted)"
      }
    }, label), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-subtle)"
      }
    }, "/"));
  }));
}
Object.assign(__ds_scope, { Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  variant = "underline",
  style
}) {
  const first = items[0] && (typeof items[0] === "string" ? items[0] : items[0].value);
  const [inner, setInner] = React.useState(defaultValue ?? first);
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;
  const pick = v => {
    if (!isControlled) setInner(v);
    onChange && onChange(v);
  };
  const seg = variant === "segmented";
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: seg ? 2 : 4,
      padding: seg ? 3 : 0,
      background: seg ? "var(--surface-sunken)" : "transparent",
      border: seg ? "1px solid var(--border-subtle)" : "none",
      borderBottom: seg ? "1px solid var(--border-subtle)" : "1px solid var(--border-subtle)",
      borderRadius: seg ? "var(--radius-lg)" : 0,
      ...style
    }
  }, items.map(it => {
    const v = typeof it === "string" ? it : it.value;
    const label = typeof it === "string" ? it : it.label;
    const count = typeof it === "string" ? undefined : it.count;
    const on = current === v;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": on,
      onClick: () => pick(v),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        height: seg ? 28 : 36,
        padding: seg ? "0 12px" : "0 4px",
        marginBottom: seg ? 0 : -1,
        font: "var(--type-ui)",
        color: on ? "var(--text-strong)" : "var(--text-muted)",
        background: seg && on ? "var(--surface-card)" : "transparent",
        border: "none",
        borderBottom: seg ? "none" : `2px solid ${on ? "var(--accent-500)" : "transparent"}`,
        borderRadius: seg ? "var(--radius-md)" : 0,
        boxShadow: seg && on ? "var(--shadow-xs)" : "none",
        transition: "var(--transition-control)"
      }
    }, label, count !== undefined && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-code-sm)",
        color: "var(--text-subtle)"
      }
    }, count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/tools/CodePane.jsx
try { (() => {
const palette = {
  key: "var(--code-key)",
  string: "var(--code-string)",
  number: "var(--code-number)",
  boolean: "var(--code-boolean)",
  punct: "var(--code-punct)",
  plain: "var(--code-fg)"
};

/* Minimal JSON tokenizer — enough for previewing payloads, not a real parser. */
function tokenize(src) {
  const out = [];
  const re = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}\[\],:])/g;
  let last = 0,
    m;
  while (m = re.exec(src)) {
    if (m.index > last) out.push([src.slice(last, m.index), "plain"]);
    const kind = m[1] ? "key" : m[2] ? "string" : m[3] ? "number" : m[4] ? "boolean" : "punct";
    out.push([m[0], kind]);
    last = re.lastIndex;
  }
  if (last < src.length) out.push([src.slice(last), "plain"]);
  return out;
}
function CodePane({
  code = "",
  language = "json",
  wrap = true,
  lineNumbers = false,
  height,
  tone = "dark",
  style
}) {
  const dark = tone === "dark";
  const body = language === "json" ? tokenize(code).map(([t, k], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      color: dark ? palette[k] : k === "plain" ? "var(--text-body)" : palette[k]
    }
  }, t)) : code;
  const lines = code.split("\n");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: dark ? "var(--surface-code)" : "var(--surface-sunken)",
      color: dark ? "var(--code-fg)" : "var(--text-body)",
      borderRadius: "var(--radius-md)",
      padding: "12px 14px",
      font: "var(--type-code)",
      overflow: "auto",
      height,
      ...style
    }
  }, lineNumbers ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      columnGap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--code-comment)",
      textAlign: "right",
      userSelect: "none"
    }
  }, lines.map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, i + 1))), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      whiteSpace: wrap ? "pre-wrap" : "pre",
      wordBreak: wrap ? "break-word" : "normal",
      font: "inherit"
    }
  }, body)) : /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      whiteSpace: wrap ? "pre-wrap" : "pre",
      wordBreak: wrap ? "break-word" : "normal",
      font: "inherit"
    }
  }, body));
}
Object.assign(__ds_scope, { CodePane });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/tools/CodePane.jsx", error: String((e && e.message) || e) }); }

// components/tools/Icon.jsx
try { (() => {
/* Renders a Lucide glyph from the UMD build loaded on the page
   (https://unpkg.com/lucide@0.454.0/dist/umd/lucide.js -> window.lucide.icons).
   No icon paths are re-drawn here; the node data comes from Lucide itself. */

function toPascal(name) {
  return String(name).replace(/(^|[-_ ])(\w)/g, (_, __, c) => c.toUpperCase());
}
function lookup(name) {
  const lib = typeof window !== "undefined" && window.lucide && (window.lucide.icons || window.lucide);
  if (!lib) return null;
  return lib[toPascal(name)] || lib[name] || null;
}
function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  color = "currentColor",
  style,
  ...rest
}) {
  const node = lookup(name);
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "block",
      flex: "0 0 auto",
      ...style
    },
    "aria-hidden": true,
    ...rest
  };
  if (!node) return /*#__PURE__*/React.createElement("svg", common);
  // Lucide UMD exposes ["svg", attrs, children]; older shapes are already a pair array.
  const children = Array.isArray(node[2]) ? node[2] : node;
  return /*#__PURE__*/React.createElement("svg", common, children.map(([tag, attrs], i) => React.createElement(tag, {
    key: i,
    ...attrs
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/tools/Icon.jsx", error: String((e && e.message) || e) }); }

// components/tools/CopyButton.jsx
try { (() => {
function CopyButton({
  value = "",
  label = "Копировать",
  copiedLabel = "Скопировано",
  size = "sm",
  variant = "secondary",
  style
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try {
      navigator.clipboard && navigator.clipboard.writeText(value);
    } catch (e) {/* preview sandbox */}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: size,
    variant: variant,
    onClick: copy,
    style: style,
    iconLeft: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: copied ? "check" : "copy",
      size: 14
    })
  }, copied ? copiedLabel : label);
}
Object.assign(__ds_scope, { CopyButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/tools/CopyButton.jsx", error: String((e && e.message) || e) }); }

// components/tools/ToolCard.jsx
try { (() => {
function ToolCard({
  icon,
  title,
  description,
  category,
  shortcut,
  isNew = false,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    interactive: true,
    padding: "var(--space-4)",
    onClick: onClick,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "var(--radius-md)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--surface-accent-soft)",
      color: "var(--text-accent)"
    }
  }, icon), isNew && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "accent"
  }, "NEW")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-ui)",
      fontSize: "var(--text-base)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-strong)",
      letterSpacing: "var(--tracking-snug)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      font: "var(--type-caption)",
      color: "var(--text-muted)",
      lineHeight: 1.45
    }
  }, description)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-subtle)"
    }
  }, category), shortcut && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-code-sm)",
      color: "var(--text-subtle)"
    }
  }, shortcut)));
}
Object.assign(__ds_scope, { ToolCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/tools/ToolCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/MobileApp.jsx
try { (() => {
const {
  Icon,
  Card,
  Badge,
  Button,
  Tag,
  Tabs,
  Textarea,
  CodePane,
  CopyButton,
  IconButton,
  Input
} = window.ToolBoxDesignSystem_88556c;
const M_TOOLS = [{
  id: "jwt",
  icon: "key-round",
  title: "JWT decoder",
  category: "Безопасность"
}, {
  id: "base64",
  icon: "binary",
  title: "Base64",
  category: "Кодирование"
}, {
  id: "qr",
  icon: "qr-code",
  title: "QR-генератор",
  category: "Генераторы"
}, {
  id: "diff",
  icon: "file-diff",
  title: "Сравнение текстов",
  category: "Текст"
}, {
  id: "json",
  icon: "braces",
  title: "JSON formatter",
  category: "Кодирование"
}, {
  id: "hash",
  icon: "hash",
  title: "Хэши",
  category: "Безопасность"
}];
function TopBar({
  title,
  onBack,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 52,
      flex: "0 0 52px",
      padding: "0 12px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--surface-card)"
    }
  }, onBack ? /*#__PURE__*/React.createElement(IconButton, {
    label: "\u041D\u0430\u0437\u0430\u0434",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-left",
    size: 18
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "var(--radius-md)",
      background: "var(--accent-500)",
      color: "#fff",
      font: "var(--type-ui)",
      fontWeight: 800,
      fontSize: 14,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "T"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-ui)",
      fontSize: "var(--text-md)",
      fontWeight: 700,
      letterSpacing: "var(--tracking-snug)",
      color: "var(--text-strong)"
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 4
    }
  }, action));
}
function TabBar({
  current,
  onChange
}) {
  const items = [["home", "Инструменты", "layout-grid"], ["fav", "Избранное", "star"], ["history", "История", "history"], ["more", "Ещё", "menu"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      flex: "0 0 62px",
      paddingBottom: 6,
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-card)"
    }
  }, items.map(([id, label, icon]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => onChange(id),
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      minHeight: 56,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: current === id ? "var(--text-accent)" : "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      fontSize: 11
    }
  }, label))));
}
function MobileList({
  onOpen
}) {
  const [tab, setTab] = React.useState("home");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopBar, {
    title: "ToolBox",
    action: /*#__PURE__*/React.createElement(IconButton, {
      label: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user-round",
      size: 18
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: "auto",
      padding: "14px 14px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "md",
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0430",
    prefix: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 15
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflow: "auto",
      paddingBottom: 2
    }
  }, ["Все", "Безопасность", "Кодирование", "Текст", "Генераторы"].map((c, i) => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    interactive: true,
    selected: i === 0
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, M_TOOLS.map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.id,
    interactive: true,
    padding: "12px 14px",
    onClick: () => onOpen(t.id)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      minHeight: 44
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      flex: "0 0 36px",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-accent-soft)",
      color: "var(--text-accent)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: t.icon,
    size: 19
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--type-ui)",
      fontSize: "var(--text-base)",
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, t.title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 2,
      font: "var(--type-caption)",
      color: "var(--text-subtle)"
    }
  }, t.category)), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  }))))), /*#__PURE__*/React.createElement(Card, {
    padding: "14px",
    style: {
      background: "var(--surface-sunken)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--type-ui)",
      color: "var(--text-strong)"
    }
  }, "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C ToolBox"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 2,
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "\u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D, \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0441 \u0434\u043E\u043C\u0430\u0448\u043D\u0435\u0433\u043E \u044D\u043A\u0440\u0430\u043D\u0430")), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C")))), /*#__PURE__*/React.createElement(TabBar, {
    current: tab,
    onChange: setTab
  }));
}
function MobileTool({
  onBack
}) {
  const [tab, setTab] = React.useState("payload");
  const HEADER = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
  const PAYLOAD = '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true,\n  "exp": 1767225600\n}';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopBar, {
    title: "JWT decoder",
    onBack: onBack,
    action: /*#__PURE__*/React.createElement(IconButton, {
      label: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "share-2",
      size: 18
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: "auto",
      padding: "14px 14px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 4,
    label: "\u0422\u043E\u043A\u0435\u043D",
    defaultValue: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVP"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "\u041F\u043E\u0434\u043F\u0438\u0441\u044C \u0432\u0435\u0440\u043D\u0430"), /*#__PURE__*/React.createElement(Badge, {
    mono: true
  }, "HS256"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(CopyButton, {
    value: PAYLOAD,
    label: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C"
  }))), /*#__PURE__*/React.createElement(Tabs, {
    variant: "segmented",
    items: [{
      value: "payload",
      label: "Payload"
    }, {
      value: "header",
      label: "Header"
    }],
    value: tab,
    onChange: setTab,
    style: {
      width: "100%"
    }
  }), /*#__PURE__*/React.createElement(CodePane, {
    code: tab === "payload" ? PAYLOAD : HEADER
  }), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "shield-check",
      size: 15
    })
  }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u044C")));
}
function MobileApp() {
  const [screen, setScreen] = React.useState("list");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 28,
      justifyContent: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(PhoneFrame, {
    theme: "light",
    label: "\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u2014 \u0441\u0432\u0435\u0442\u043B\u0430\u044F \u0442\u0435\u043C\u0430"
  }, screen === "list" ? /*#__PURE__*/React.createElement(MobileList, {
    onOpen: () => setScreen("tool")
  }) : /*#__PURE__*/React.createElement(MobileTool, {
    onBack: () => setScreen("list")
  })), /*#__PURE__*/React.createElement(PhoneFrame, {
    theme: "dark",
    label: "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442 \u2014 \u0442\u0451\u043C\u043D\u0430\u044F \u0442\u0435\u043C\u0430"
  }, /*#__PURE__*/React.createElement(MobileTool, {
    onBack: () => {}
  })));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(MobileApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/MobileApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/PhoneFrame.jsx
try { (() => {
function PhoneFrame({
  theme,
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-theme": theme === "dark" ? "dark" : undefined,
    style: {
      width: 390,
      height: 700,
      borderRadius: 34,
      overflow: "hidden",
      position: "relative",
      background: "var(--surface-page)",
      color: "var(--text-body)",
      border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-lg)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 34,
      flex: "0 0 34px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      font: "var(--type-code-sm)",
      color: "var(--text-muted)",
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "LTE"), /*#__PURE__*/React.createElement("span", null, "100%"))), children), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, label));
}
Object.assign(window, {
  PhoneFrame
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/PhoneFrame.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/App.jsx
try { (() => {
function App() {
  const [theme, setTheme] = React.useState("light");
  const [screen, setScreen] = React.useState("catalog");
  const recent = TOOLS.filter(t => ["jwt", "base64", "qr", "diff"].includes(t.id));
  return /*#__PURE__*/React.createElement(AppShell, {
    theme: theme,
    onTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    current: screen,
    onNavigate: setScreen,
    recent: recent
  }, screen === "jwt" ? /*#__PURE__*/React.createElement(JwtDecoderScreen, null) : screen === "base64" ? /*#__PURE__*/React.createElement(Base64Screen, null) : /*#__PURE__*/React.createElement(CatalogScreen, {
    onOpen: id => setScreen(["jwt", "base64"].includes(id) ? id : "jwt")
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/AppShell.jsx
try { (() => {
const {
  Icon,
  IconButton,
  Input,
  Kbd,
  Tooltip,
  Badge
} = window.ToolBoxDesignSystem_88556c;
function Wordmark({
  dark
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: "var(--radius-md)",
      background: "var(--accent-500)",
      color: "#fff",
      font: "var(--type-ui)",
      fontWeight: 800,
      fontSize: 14,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "T"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: 17,
      letterSpacing: "-0.03em",
      color: "var(--text-strong)"
    }
  }, "Tool", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--accent-500)"
    }
  }, "Box")));
}
function SidebarItem({
  icon,
  label,
  active,
  badge,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      height: 32,
      padding: "0 10px",
      border: "none",
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      textAlign: "left",
      font: "var(--type-ui)",
      transition: "var(--transition-control)",
      background: active ? "var(--surface-accent-soft)" : hover ? "var(--surface-hover)" : "transparent",
      color: active ? "var(--text-accent)" : "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, label), badge && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-code-sm)",
      color: "var(--text-subtle)"
    }
  }, badge));
}
function AppShell({
  theme,
  onTheme,
  current,
  onNavigate,
  recent = [],
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    "data-theme": theme === "dark" ? "dark" : undefined,
    style: {
      minHeight: "100vh",
      background: "var(--surface-page)",
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      height: "var(--topbar-height)",
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 var(--page-gutter)",
      background: "color-mix(in srgb, var(--surface-card) 88%, transparent)",
      backdropFilter: "saturate(180%) blur(8px)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate("catalog");
    }
  }, /*#__PURE__*/React.createElement(Wordmark, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 440
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0430",
    prefix: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 14
    }),
    suffix: /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement(Kbd, null, "\u2318"), /*#__PURE__*/React.createElement(Kbd, null, "K"))
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Tooltip, {
    content: "\u0412\u0441\u0451 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "\u041E\u0444\u043B\u0430\u0439\u043D-\u0440\u0435\u0436\u0438\u043C")), /*#__PURE__*/React.createElement(Tooltip, {
    content: theme === "dark" ? "Светлая тема" : "Тёмная тема"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "\u0422\u0435\u043C\u0430",
    onClick: onTheme
  }, /*#__PURE__*/React.createElement(Icon, {
    name: theme === "dark" ? "sun" : "moon"
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    content: "GitHub"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "GitHub"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "github"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: "999px",
      background: "var(--surface-sunken)",
      border: "1px solid var(--border-subtle)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      font: "var(--type-label)",
      color: "var(--text-muted)"
    }
  }, "\u0410\u041B"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "var(--sidebar-width) 1fr",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      position: "sticky",
      top: "var(--topbar-height)",
      height: "calc(100vh - var(--topbar-height))",
      overflow: "auto",
      padding: "var(--space-4) var(--space-3)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "layout-grid",
    label: "\u0412\u0441\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B",
    active: current === "catalog",
    onClick: () => onNavigate("catalog"),
    badge: TOOLS.length
  }), /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "star",
    label: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435",
    badge: "3"
  }), /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "history",
    label: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 10px 6px",
      font: "var(--type-label)",
      color: "var(--text-subtle)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase"
    }
  }, "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, recent.map(t => /*#__PURE__*/React.createElement(SidebarItem, {
    key: t.id,
    icon: t.icon,
    label: t.title,
    active: current === t.id,
    onClick: () => onNavigate(t.id)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: "10px",
      borderRadius: "var(--radius-lg)",
      background: "var(--surface-sunken)",
      border: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-ui)",
      color: "var(--text-strong)"
    }
  }, "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, "PWA \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043E\u0444\u043B\u0430\u0439\u043D \u0438 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0438\u0437 \u0434\u043E\u043A\u0430."))), /*#__PURE__*/React.createElement("main", {
    style: {
      padding: "var(--space-8) var(--page-gutter) var(--space-16)",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto"
    }
  }, children))));
}
Object.assign(window, {
  AppShell,
  Wordmark,
  SidebarItem
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/Base64Screen.jsx
try { (() => {
const {
  Icon,
  Card,
  Badge,
  Button,
  Tabs,
  Textarea,
  Checkbox,
  Breadcrumbs,
  CodePane,
  CopyButton,
  Switch
} = window.ToolBoxDesignSystem_88556c;
function Base64Screen() {
  const [mode, setMode] = React.useState("encode");
  const [text, setText] = React.useState("Дизайн-система ToolBox");
  const encoded = (() => {
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
      return "";
    }
  })();
  const decoded = (() => {
    try {
      return decodeURIComponent(escape(atob(text)));
    } catch (e) {
      return "Некорректная base64-строка";
    }
  })();
  const out = mode === "encode" ? encoded : decoded;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement(Breadcrumbs, {
    items: [{
      label: "Инструменты",
      href: "#"
    }, {
      label: "Кодирование",
      href: "#"
    }, "Base64"]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: "var(--type-h1)",
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-strong)"
    }
  }, "Base64"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      font: "var(--type-body)",
      color: "var(--text-muted)"
    }
  }, "\u041A\u043E\u0434\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438 \u0434\u0435\u043A\u043E\u0434\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u0430 \u0438 \u0444\u0430\u0439\u043B\u043E\u0432, UTF-8 \u0438 URL-safe \u0430\u043B\u0444\u0430\u0432\u0438\u0442.")), /*#__PURE__*/React.createElement(Tabs, {
    variant: "segmented",
    items: [{
      value: "encode",
      label: "Кодировать"
    }, {
      value: "decode",
      label: "Декодировать"
    }],
    value: mode,
    onChange: setMode
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-4)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "var(--space-4)",
    header: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\u0412\u0432\u043E\u0434"), /*#__PURE__*/React.createElement(Badge, {
      mono: true
    }, text.length, " \u0441\u0438\u043C\u0432."))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 9,
    value: text,
    onChange: e => setText(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "URL-safe \u0430\u043B\u0444\u0430\u0432\u0438\u0442",
    description: "\u0417\u0430\u043C\u0435\u043D\u044F\u0435\u0442 + / \u043D\u0430 - _"
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "\u0416\u0438\u0432\u043E\u0439 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "upload",
      size: 14
    })
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u0430\u0439\u043B"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "eraser",
      size: 14
    }),
    onClick: () => setText("")
  }, "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C")))), /*#__PURE__*/React.createElement(Card, {
    padding: "var(--space-4)",
    header: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      mono: true
    }, out.length, " \u0441\u0438\u043C\u0432."), /*#__PURE__*/React.createElement(CopyButton, {
      value: out
    })))
  }, /*#__PURE__*/React.createElement(CodePane, {
    language: "text",
    code: out,
    height: "248px"
  }))));
}
Object.assign(window, {
  Base64Screen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/Base64Screen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/CatalogScreen.jsx
try { (() => {
const {
  Icon,
  Tag,
  ToolCard,
  Button,
  EmptyState
} = window.ToolBoxDesignSystem_88556c;
function CatalogScreen({
  onOpen
}) {
  const [cat, setCat] = React.useState("Все");
  const list = cat === "Все" ? TOOLS : TOOLS.filter(t => t.category === cat);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: "var(--type-h1)",
      fontSize: "var(--text-4xl)",
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-strong)"
    }
  }, "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u0430"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "8px 0 0",
      font: "var(--type-body)",
      color: "var(--text-muted)",
      maxWidth: 620
    }
  }, TOOLS.length, " \u0443\u0442\u0438\u043B\u0438\u0442 \u0432 \u043E\u0434\u043D\u043E\u043C \u043C\u0435\u0441\u0442\u0435. \u0412\u0441\u0451 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u2014 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0438\u043A\u0443\u0434\u0430 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    interactive: true,
    selected: c === cat,
    onClick: () => setCat(c)
  }, c)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      font: "var(--type-caption)",
      color: "var(--text-subtle)"
    }
  }, list.length, " \u0438\u0437 ", TOOLS.length)), list.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "search-x",
      size: 22
    }),
    title: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E",
    description: "\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u0443\u044E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setCat("Все")
    }, "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440")
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(238px, 1fr))",
      gap: "var(--space-4)"
    }
  }, list.map(t => /*#__PURE__*/React.createElement(ToolCard, {
    key: t.id,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: t.icon,
      size: 22
    }),
    title: t.title,
    description: t.description,
    category: t.category,
    shortcut: t.shortcut,
    isNew: t.isNew,
    onClick: () => onOpen(t.id)
  }))));
}
Object.assign(window, {
  CatalogScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/CatalogScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/JwtDecoderScreen.jsx
try { (() => {
const {
  Icon,
  Card,
  Badge,
  Button,
  Tabs,
  Textarea,
  Input,
  Select,
  Breadcrumbs,
  CodePane,
  CopyButton,
  Toast,
  Switch
} = window.ToolBoxDesignSystem_88556c;
const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlLCJpYXQiOjE3MzU2ODk2MDAsImV4cCI6MTc2NzIyNTYwMH0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const HEADER_JSON = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
const PAYLOAD_JSON = '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true,\n  "iat": 1735689600,\n  "exp": 1767225600\n}';
function SegmentedToken({
  value
}) {
  const [h, p, s] = value.split(".");
  const seg = (t, color) => /*#__PURE__*/React.createElement("span", {
    style: {
      color,
      wordBreak: "break-all"
    }
  }, t);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-code)",
      background: "var(--surface-code)",
      borderRadius: "var(--radius-md)",
      padding: "12px 14px",
      lineHeight: 1.6
    }
  }, seg(h, "var(--code-key)"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--code-punct)"
    }
  }, "."), seg(p, "var(--code-string)"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--code-punct)"
    }
  }, "."), seg(s, "var(--code-number)"));
}
function ClaimRow({
  k,
  v,
  note
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "120px 1fr",
      gap: 12,
      padding: "8px 0",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-code-sm)",
      color: "var(--text-muted)"
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-ui)",
      color: "var(--text-strong)"
    }
  }, v, note && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      font: "var(--type-caption)",
      color: "var(--text-subtle)"
    }
  }, note)));
}
function JwtDecoderScreen({
  onBack
}) {
  const [token, setToken] = React.useState(SAMPLE_JWT);
  const [tab, setTab] = React.useState("payload");
  const [toast, setToast] = React.useState(false);
  const valid = token.split(".").length === 3;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement(Breadcrumbs, {
    items: [{
      label: "Инструменты",
      href: "#"
    }, {
      label: "Безопасность",
      href: "#"
    }, "JWT decoder"]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 280
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: "var(--type-h1)",
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-strong)"
    }
  }, "JWT decoder"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      font: "var(--type-body)",
      color: "var(--text-muted)"
    }
  }, "\u0420\u0430\u0437\u0431\u043E\u0440 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430 \u0438 payload, \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 HMAC-\u043F\u043E\u0434\u043F\u0438\u0441\u0438. \u0422\u043E\u043A\u0435\u043D \u043D\u0435 \u043F\u043E\u043A\u0438\u0434\u0430\u0435\u0442 \u0432\u043A\u043B\u0430\u0434\u043A\u0443.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "rotate-ccw",
      size: 14
    }),
    onClick: () => setToken(SAMPLE_JWT)
  }, "\u041F\u0440\u0438\u043C\u0435\u0440"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "share-2",
      size: 14
    })
  }, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "star",
      size: 14
    })
  }, "\u0412 \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-4)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "var(--space-4)",
    header: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\u0422\u043E\u043A\u0435\u043D"), /*#__PURE__*/React.createElement(Badge, {
      mono: true
    }, token.length, " \u0441\u0438\u043C\u0432."))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 6,
    value: token,
    onChange: e => setToken(e.target.value),
    resize: "vertical"
  }), /*#__PURE__*/React.createElement(SegmentedToken, {
    value: token
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      font: "var(--type-caption)",
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: "var(--code-key)"
    }
  }), "header"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: "var(--code-string)"
    }
  }), "payload"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: "var(--code-number)"
    }
  }), "signature")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "var(--space-4)",
    header: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442"), valid ? /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "\u041F\u043E\u0434\u043F\u0438\u0441\u044C \u0432\u0435\u0440\u043D\u0430") : /*#__PURE__*/React.createElement(Badge, {
      tone: "danger",
      dot: true
    }, "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0442\u043E\u043A\u0435\u043D"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "segmented",
    items: [{
      value: "payload",
      label: "Payload"
    }, {
      value: "header",
      label: "Header"
    }, {
      value: "claims",
      label: "Claims"
    }],
    value: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement(CopyButton, {
    value: tab === "header" ? HEADER_JSON : PAYLOAD_JSON
  })), tab === "claims" ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ClaimRow, {
    k: "sub",
    v: "1234567890"
  }), /*#__PURE__*/React.createElement(ClaimRow, {
    k: "name",
    v: "Ada Lovelace"
  }), /*#__PURE__*/React.createElement(ClaimRow, {
    k: "admin",
    v: "true"
  }), /*#__PURE__*/React.createElement(ClaimRow, {
    k: "iat",
    v: "1 \u044F\u043D\u0432\u0430\u0440\u044F 2025, 03:00",
    note: "1735689600"
  }), /*#__PURE__*/React.createElement(ClaimRow, {
    k: "exp",
    v: "1 \u044F\u043D\u0432\u0430\u0440\u044F 2026, 03:00",
    note: "\u0447\u0435\u0440\u0435\u0437 4 \u043C\u0435\u0441\u044F\u0446\u0430"
  })) : /*#__PURE__*/React.createElement(CodePane, {
    code: tab === "header" ? HEADER_JSON : PAYLOAD_JSON,
    lineNumbers: true
  }))), /*#__PURE__*/React.createElement(Card, {
    padding: "var(--space-4)",
    header: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043F\u043E\u0434\u043F\u0438\u0441\u0438"), /*#__PURE__*/React.createElement(Badge, {
      mono: true
    }, "HS256"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "140px 1fr",
      gap: 12,
      alignItems: "end"
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "\u0410\u043B\u0433\u043E\u0440\u0438\u0442\u043C",
    options: ["HS256", "HS384", "HS512", "RS256"]
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Secret",
    mono: true,
    defaultValue: "your-256-bit-secret",
    suffix: /*#__PURE__*/React.createElement(Icon, {
      name: "eye",
      size: 14
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Secret \u0432 base64"
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "shield-check",
      size: 14
    }),
    onClick: () => setToast(true)
  }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C")))))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      right: 24,
      bottom: 24,
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "shield-check",
      size: 16
    }),
    title: "\u041F\u043E\u0434\u043F\u0438\u0441\u044C \u0432\u0435\u0440\u043D\u0430",
    description: "HMAC SHA-256 \u0441\u043E\u0432\u043F\u0430\u043B \u0441 \u0441\u0435\u043A\u0440\u0435\u0442\u043E\u043C",
    onClose: () => setToast(false)
  })));
}
Object.assign(window, {
  JwtDecoderScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/JwtDecoderScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portal/tools.data.jsx
try { (() => {
const TOOLS = [{
  id: "jwt",
  icon: "key-round",
  title: "JWT decoder",
  description: "Разбор заголовка и payload, проверка подписи",
  category: "Безопасность",
  shortcut: "⌘1"
}, {
  id: "base64",
  icon: "binary",
  title: "Base64",
  description: "Кодирование и декодирование строк и файлов",
  category: "Кодирование",
  shortcut: "⌘2"
}, {
  id: "qr",
  icon: "qr-code",
  title: "QR-генератор",
  description: "Ссылки, Wi-Fi, vCard, настройка коррекции",
  category: "Генераторы",
  shortcut: "⌘3",
  isNew: true
}, {
  id: "diff",
  icon: "file-diff",
  title: "Сравнение текстов",
  description: "Построчный и посимвольный diff",
  category: "Текст",
  shortcut: "⌘4"
}, {
  id: "json",
  icon: "braces",
  title: "JSON formatter",
  description: "Форматирование, минификация, валидация",
  category: "Кодирование",
  shortcut: "⌘5"
}, {
  id: "regex",
  icon: "regex",
  title: "Regex tester",
  description: "Проверка выражений и групп захвата",
  category: "Текст",
  shortcut: "⌘6"
}, {
  id: "hash",
  icon: "hash",
  title: "Хэши",
  description: "MD5, SHA-1, SHA-256, SHA-512",
  category: "Безопасность",
  shortcut: "⌘7"
}, {
  id: "uuid",
  icon: "fingerprint",
  title: "UUID / генераторы",
  description: "UUID v4/v7, случайные строки, пароли",
  category: "Генераторы",
  shortcut: "⌘8"
}, {
  id: "time",
  icon: "clock",
  title: "Timestamp",
  description: "Unix ↔ ISO 8601, часовые пояса",
  category: "Конвертеры",
  shortcut: "⌘9"
}, {
  id: "units",
  icon: "ruler",
  title: "Конвертер единиц",
  description: "Байты, длина, масса, температура",
  category: "Конвертеры"
}, {
  id: "color",
  icon: "palette",
  title: "Color tools",
  description: "HEX ↔ RGB ↔ OKLCH, контраст WCAG",
  category: "Дизайн"
}, {
  id: "url",
  icon: "link",
  title: "URL encode",
  description: "Percent-encoding и разбор query-строки",
  category: "Кодирование"
}];
const CATEGORIES = ["Все", "Безопасность", "Кодирование", "Текст", "Генераторы", "Конвертеры", "Дизайн"];
Object.assign(window, {
  TOOLS,
  CATEGORIES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portal/tools.data.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Kbd = __ds_scope.Kbd;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.CodePane = __ds_scope.CodePane;

__ds_ns.CopyButton = __ds_scope.CopyButton;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ToolCard = __ds_scope.ToolCard;

})();
