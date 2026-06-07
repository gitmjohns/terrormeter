"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HORROR_EMOJIS, DEFAULT_EMOJI, AVATAR_COLORS, DEFAULT_BG } from "@/lib/constants";

interface SettingsFormProps {
  initialUsername: string;
  initialEmoji: string;
  initialBg: string;
  isPrimeAdmin: boolean;
}

export function SettingsForm({ initialUsername, initialEmoji, initialBg, isPrimeAdmin }: SettingsFormProps) {
  const router = useRouter();

  const [username, setUsername] = useState(initialUsername);
  const [usernamePending, setUsernamePending] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);

  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji || DEFAULT_EMOJI);
  const [savedEmoji, setSavedEmoji] = useState(initialEmoji || DEFAULT_EMOJI);
  const [selectedBg, setSelectedBg] = useState(initialBg || DEFAULT_BG);
  const [savedBg, setSavedBg] = useState(initialBg || DEFAULT_BG);

  const [emojiPending, setEmojiPending] = useState(false);
  const [emojiMsg, setEmojiMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  async function handleUsernameConfirm() {
    setUsernamePending(true);
    setUsernameMsg(null);
    const res = await fetch("/api/settings/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (data.error) {
      setUsernameMsg({ type: "error", text: data.error });
    } else {
      setUsernameMsg({ type: "success", text: "Username updated!" });
      setEditingUsername(false);
    }
    setUsernamePending(false);
    setShowUsernameConfirm(false);
  }

  async function handleEmojiSave() {
    setEmojiPending(true);
    setEmojiMsg(null);
    const res = await fetch("/api/settings/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emoji: selectedEmoji, bg: selectedBg }),
    });
    const data = await res.json();
    if (data.error) {
      setEmojiMsg({ type: "error", text: data.error });
    } else {
      setEmojiMsg({ type: "success", text: "Avatar updated!" });
      setSavedEmoji(selectedEmoji);
      setSavedBg(selectedBg);
      window.dispatchEvent(new CustomEvent("avatarEmojiUpdated", { detail: { emoji: selectedEmoji, bg: selectedBg } }));
    }
    setEmojiPending(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeletePending(true);
    setDeleteMsg(null);
    const res = await fetch("/api/settings/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.error) { setDeleteMsg(data.error); setDeletePending(false); }
    else router.push("/");
  }

  const inputCls = "w-full bg-shadow border border-purple-deep rounded-lg px-4 py-2.5 text-ghost placeholder-muted text-sm focus:outline-none focus:border-purple-mid";
  const cardCls  = "bg-tomb border border-shadow rounded-2xl p-6 space-y-4 mb-6";
  const labelCls = "block text-sm text-specter mb-1.5";
  const saveBtnCls = "px-4 py-2 bg-purple-mid hover:bg-purple-light text-ghost text-sm font-bold rounded-lg transition-colors disabled:opacity-60";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-4xl text-ghost mb-8">Settings</h1>

      {/* Profile Card */}
      <div className={cardCls}>
        <h2 className="text-lg font-medium text-ghost border-b border-shadow pb-3">Profile</h2>

        {/* Avatar Emoji Selector */}
        <div>
          <label className={labelCls}>Avatar</label>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: selectedBg }}
            >
              {selectedEmoji}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Choose your horror avatar and background color.<br />
              Selected: <span className="text-ghost">{selectedEmoji}</span>
            </p>
          </div>

          <div className="grid grid-cols-6 gap-2 mb-4">
            {HORROR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all duration-150 ${
                  selectedEmoji === emoji
                    ? "bg-purple-mid ring-2 ring-green-spooky scale-110"
                    : "bg-shadow hover:bg-purple-deep hover:scale-105"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs text-muted mb-2">Background Color</p>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedBg(c.hex)}
                  title={c.name}
                  className={`w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 ${
                    selectedBg === c.hex ? "ring-2 ring-green-spooky scale-110" : ""
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleEmojiSave}
              disabled={emojiPending || (selectedEmoji === savedEmoji && selectedBg === savedBg)}
              className={saveBtnCls}
            >
              {emojiPending ? "Saving…" : "Save Avatar"}
            </button>
            {emojiMsg && (
              <span className={`text-xs ${emojiMsg.type === "success" ? "text-green-spooky" : "text-dookie-light"}`}>
                {emojiMsg.text}
              </span>
            )}
          </div>
        </div>

        {/* Username */}
        <div className="space-y-3 pt-2 border-t border-shadow">
          <div>
            <label className={labelCls}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${inputCls} ${!editingUsername ? "opacity-50 cursor-not-allowed" : ""}`}
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              disabled={!editingUsername}
              required
            />
          </div>
          {usernameMsg && (
            <p className={`text-xs ${usernameMsg.type === "success" ? "text-green-spooky" : "text-dookie-light"}`}>
              {usernameMsg.text}
            </p>
          )}
          {editingUsername ? (
            <button type="button" onClick={() => setShowUsernameConfirm(true)} disabled={usernamePending} className={saveBtnCls}>
              {usernamePending ? "Saving…" : "Save Username"}
            </button>
          ) : (
            <button type="button" onClick={() => setEditingUsername(true)} className={saveBtnCls}>
              Change Username
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {isPrimeAdmin ? (
        <div className={`${cardCls} border-shadow`}>
          <h2 className="text-lg font-medium text-muted border-b border-shadow pb-3">Danger Zone</h2>
          <p className="text-sm text-muted">This account cannot be deleted.</p>
        </div>
      ) : (
        <div className={`${cardCls} border-dookie`}>
          <h2 className="text-lg font-medium text-dookie-light border-b border-dookie/40 pb-3">Danger Zone</h2>
          <p className="text-sm text-muted">Once you delete your account, there is no going back.</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 border border-dookie text-dookie hover:bg-dookie/10 text-sm font-bold rounded-lg transition-colors"
          >
            Delete Account
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {!isPrimeAdmin && showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm px-4">
          <div className="bg-tomb border border-shadow rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display text-2xl text-dookie-light">Delete Account</h3>
            <p className="text-sm text-muted">
              This cannot be undone. Type <span className="font-mono font-bold text-ghost">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className={inputCls}
              placeholder="Type DELETE to confirm"
            />
            {deleteMsg && <p className="text-xs text-dookie-light">{deleteMsg}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deletePending || deleteConfirm !== "DELETE"}
                className="flex-1 py-2 bg-dookie hover:bg-dookie-light text-ghost text-sm font-bold rounded-lg transition-colors disabled:opacity-40"
              >
                {deletePending ? "Deleting…" : "Confirm Delete"}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteMsg(null); }}
                className="flex-1 py-2 bg-tomb border border-shadow text-specter hover:text-ghost text-sm font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Username Change Confirm Modal */}
      {showUsernameConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm px-4">
          <div className="bg-tomb border border-shadow rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display text-2xl text-ghost">Change Username</h3>
            <p className="text-sm text-muted">Are you sure you want to change your username?</p>
            <div className="flex gap-3">
              <button
                onClick={handleUsernameConfirm}
                disabled={usernamePending}
                className="flex-1 py-2 bg-purple-mid hover:bg-purple-light text-ghost text-sm font-bold rounded-lg transition-colors disabled:opacity-60"
              >
                {usernamePending ? "Saving…" : "Confirm"}
              </button>
              <button
                onClick={() => setShowUsernameConfirm(false)}
                className="flex-1 py-2 bg-tomb border border-shadow text-specter hover:text-ghost text-sm font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
