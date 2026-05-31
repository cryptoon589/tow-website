"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveRaider, getCurrentUser } from "@/lib/raidStorage";
import { formatHandle, normalizeHandle } from "@/config/raidBoard";
import { saveRewardProfile } from "@/lib/towLeaderboard";

export default function RegisterForm() {
  const router = useRouter();

  const [xUsername, setXUsername] = useState("");
  const [wallet, setWallet] = useState("");
  const [telegram, setTelegram] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [existingUser, setExistingUser] =
    useState<any>(null);

  useEffect(() => {
    setExistingUser(getCurrentUser());
  }, []);

  async function handleSubmit() {
    setError("");
    setMessage("");

    const cleanXUsername =
      normalizeHandle(xUsername);

    const cleanWallet = wallet.trim();

    const cleanTelegram =
      normalizeHandle(telegram);

    if (!cleanXUsername) {
      setError("X username is required.");
      return;
    }

    if (
      !/^[A-Za-z0-9_]{1,15}$/.test(
        cleanXUsername
      )
    ) {
      setError(
        "Enter your X username only, without @."
      );
      return;
    }

    if (!cleanWallet) {
      setError("Wallet address is required.");
      return;
    }

    if (cleanWallet.length < 10) {
      setError("Invalid wallet address.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Existing raid board profile
       */
      saveRaider({
        xUsername: cleanXUsername,
        wallet: cleanWallet,
        telegram: cleanTelegram || undefined,
        registeredAt: new Date().toISOString(),
      });

      /*
       * Shared TOW identity profile
       */
      saveRewardProfile({
        xUsername: cleanXUsername,
        walletAddress: cleanWallet,
        createdAt: new Date().toISOString(),
      });

      /*
       * Proof Of Tiredness registration
       */
      const response = await fetch(
        "/api/tired-register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            xUsername: cleanXUsername,
            walletAddress: cleanWallet,
            telegramUsername:
              cleanTelegram || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Could not register survivor identity."
        );
      }

      setMessage(
  data?.verificationCode
    ? `✅ Survivor identity saved.

Verification Code:
${data.verificationCode}

Send this to TiredBuddy:

/verify ${data.verificationCode}`
    : "Survivor identity saved."
);

/*
 * Give user time to see verification code
 */
setTimeout(() => {
  router.push("/too-tired-to-quit");
}, 8000);
    } catch (err: any) {
      setError(
        err.message ||
          "Could not save profile."
      );
    } finally {
      setLoading(false);
    }
  }

  if (existingUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">
          Survivor Identity Found
        </h1>

        <div className="rounded-lg border-2 border-black bg-gray-50 p-6">
          <p className="mb-2">
            <span className="font-bold">
              X:
            </span>{" "}
            {formatHandle(
              existingUser.xUsername
            )}
          </p>

          <p className="mb-2">
            <span className="font-bold">
              Wallet:
            </span>{" "}
            {existingUser.wallet.slice(
              0,
              6
            )}
            ...
            {existingUser.wallet.slice(-4)}
          </p>

          {existingUser.telegram ? (
            <p className="mb-4">
              <span className="font-bold">
                Telegram:
              </span>{" "}
              {formatHandle(
                existingUser.telegram
              )}
            </p>
          ) : null}

          <button
            onClick={() =>
              router.push(
                "/too-tired-to-quit"
              )
            }
            className="w-full rounded bg-black px-6 py-3 font-bold text-white hover:bg-gray-800"
          >
            Open Proof Of Tiredness
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">
        Register Survivor Identity
      </h1>

      <p className="mb-8 text-gray-600">
        One identity shared across
        TOW game, raids, rewards,
        and Proof Of Tiredness.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            X Username
          </label>

          <input
            type="text"
            value={xUsername}
            onChange={(event) =>
              setXUsername(
                normalizeHandle(
                  event.target.value
                )
              )
            }
            placeholder="your_username"
            className="w-full rounded border-2 border-black px-4 py-2 focus:outline-none"
          />

          <p className="mt-1 text-xs text-gray-500">
            No @ needed.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Wallet Address
          </label>

          <input
            type="text"
            value={wallet}
            onChange={(event) =>
              setWallet(event.target.value)
            }
            placeholder="r..."
            className="w-full rounded border-2 border-black px-4 py-2 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Telegram Username
          </label>

          <input
            type="text"
            value={telegram}
            onChange={(event) =>
              setTelegram(
                normalizeHandle(
                  event.target.value
                )
              )
            }
            placeholder="your_telegram"
            className="w-full rounded border-2 border-black px-4 py-2 focus:outline-none"
          />

          <p className="mt-1 text-xs text-gray-500">
            Required later for
            survivor claims.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="text-sm font-bold text-green-700">
            {message}
          </p>
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : "Save Survivor Identity"}
        </button>
      </div>
    </div>
  );
}
