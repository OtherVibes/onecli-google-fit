import crypto from "node:crypto";
import { createConnection, reconnectConnection } from "./connection-service";

type Login = {
  projectId: string;
  connectionId?: string;
  agentName?: string;
  callbackUrl: string;
  expiresAt: number;
};

const pending = new Map<string, Login>();
const LOGIN_TTL_MS = 10 * 60 * 1000;

export const createLinkedInBrowserLogin = (login: Omit<Login, "expiresAt">) => {
  const token = crypto.randomBytes(32).toString("base64url");
  pending.set(token, { ...login, expiresAt: Date.now() + LOGIN_TTL_MS });
  return { token, callbackUrl: login.callbackUrl };
};

export const completeLinkedInBrowserLogin = async (
  token: string,
  storageState: unknown,
  metadata: Record<string, unknown> = {},
) => {
  const login = pending.get(token);
  pending.delete(token);
  if (!login || login.expiresAt < Date.now()) {
    throw new Error("Browser login expired");
  }

  const credentials = { storageState };
  const connectionMetadata = {
    ...metadata,
    connector: "chromium",
  };
  const options = {
    scopes: ["browser_session"],
    metadata: connectionMetadata,
    label:
      typeof metadata.name === "string" ? metadata.name : "LinkedIn Chromium",
  };

  const connection = login.connectionId
    ? await reconnectConnection(
        { projectId: login.projectId },
        login.connectionId,
        credentials,
        options,
      )
    : await createConnection(
        { projectId: login.projectId },
        "linkedin-browser",
        credentials,
        options,
      );

  return { connection, agentName: login.agentName };
};
