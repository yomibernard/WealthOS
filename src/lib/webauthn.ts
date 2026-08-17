/**
 * WebAuthn / passkey helpers.
 * Biometric templates never leave the device — WealthOS only stores public credentials.
 */
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/db";

export function webauthnConfig() {
  const rpID = process.env.WEALTHOS_RP_ID || "localhost";
  const origin = process.env.WEALTHOS_ORIGIN || `http://${rpID}:3000`;
  const rpName = "WealthOS";
  return { rpID, origin, rpName };
}

const challenges = new Map<string, { challenge: string; at: number }>();

function putChallenge(userId: string, challenge: string) {
  challenges.set(userId, { challenge, at: Date.now() });
}

function takeChallenge(userId: string): string | null {
  const row = challenges.get(userId);
  challenges.delete(userId);
  if (!row) return null;
  if (Date.now() - row.at > 5 * 60 * 1000) return null;
  return row.challenge;
}

export async function buildRegistrationOptions(user: {
  id: string;
  email: string;
  name: string;
}) {
  const { rpID, rpName } = webauthnConfig();
  const existing = await prisma.webAuthnCredential.findMany({ where: { userId: user.id } });
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.name,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: c.transports
        ? (JSON.parse(c.transports) as AuthenticatorTransportFuture[])
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });
  putChallenge(user.id, options.challenge);
  return options;
}

export async function verifyAndStoreRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  label?: string,
) {
  const expectedChallenge = takeChallenge(userId);
  if (!expectedChallenge) throw new Error("Registration challenge expired — try again");
  const { rpID, origin } = webauthnConfig();
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey registration could not be verified");
  }
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  await prisma.webAuthnCredential.create({
    data: {
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64"),
      counter: credential.counter,
      transports: credential.transports ? JSON.stringify(credential.transports) : null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      label: label || "Device passkey",
    },
  });
  await prisma.authSessionEvent.create({
    data: {
      userId,
      kind: "WEBAUTHN_REGISTER",
      detail: "Passkey registered (public credential only)",
    },
  });
  return { ok: true as const };
}

export async function buildAuthenticationOptions(userId: string) {
  const { rpID } = webauthnConfig();
  const existing = await prisma.webAuthnCredential.findMany({ where: { userId } });
  if (!existing.length) throw new Error("No passkeys registered");
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: c.transports
        ? (JSON.parse(c.transports) as AuthenticatorTransportFuture[])
        : undefined,
    })),
    userVerification: "preferred",
  });
  putChallenge(userId, options.challenge);
  return options;
}

export async function verifyAuthentication(userId: string, response: AuthenticationResponseJSON) {
  const expectedChallenge = takeChallenge(userId);
  if (!expectedChallenge) throw new Error("Sign-in challenge expired — try again");
  const cred = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: response.id },
  });
  if (!cred || cred.userId !== userId) throw new Error("Unknown passkey");
  const { rpID, origin } = webauthnConfig();
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: cred.credentialId,
      publicKey: new Uint8Array(Buffer.from(cred.publicKey, "base64")),
      counter: cred.counter,
      transports: cred.transports
        ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
        : undefined,
    },
  });
  if (!verification.verified) throw new Error("Passkey verification failed");
  await prisma.webAuthnCredential.update({
    where: { id: cred.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  });
  await prisma.authSessionEvent.create({
    data: {
      userId,
      kind: "WEBAUTHN_AUTH",
      detail: "Passkey authentication succeeded",
    },
  });
  return { ok: true as const };
}
