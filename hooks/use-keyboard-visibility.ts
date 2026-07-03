import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();

  return tagName === "input" || tagName === "textarea";
}

export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      function handleFocusIn(event: FocusEvent) {
        setIsKeyboardVisible(isEditableElement(event.target));
      }

      function handleFocusOut() {
        window.setTimeout(() => {
          setIsKeyboardVisible(isEditableElement(document.activeElement));
        }, 0);
      }

      document.addEventListener("focusin", handleFocusIn);
      document.addEventListener("focusout", handleFocusOut);

      return () => {
        document.removeEventListener("focusin", handleFocusIn);
        document.removeEventListener("focusout", handleFocusOut);
      };
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return isKeyboardVisible;
}
