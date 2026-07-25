import type { AppDefinition } from "./types";

export const linkedinBrowser: AppDefinition = {
  id: "linkedin-browser",
  name: "LinkedIn via Chromium",
  icon: "/icons/linkedin.svg",
  description: "Use LinkedIn through an isolated Chromium session.",
  connectionMethod: {
    type: "browser",
    actions: [
      "get_profile",
      "get_post",
      "create_comment",
      "delete_comment",
      "send_message",
      "create_post",
      "edit_post",
      "delete_post",
    ],
  },
  available: true,
};
