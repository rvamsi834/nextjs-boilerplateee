import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export default function CollaborativeEditor() {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState({ original: "", suggestion: "", open: false });

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Hello! Start writing here...</p>",
  });

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMsg = { role: "user", content: message };
    setChat((prev) => [...prev, userMsg]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();

    const aiMsg = { role: "assistant", content: data.reply };
    setChat((prev) => [...prev, aiMsg]);
    setMessage("");
  };

  const handleSelectionEdit = async () => {
    if (!editor) return;
    const selected = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      " "
    );
    if (!selected) return;

    const res = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: selected }),
    });
    const data = await res.json();

    setPreview({ original: selected, suggestion: data.edited, open: true });
  };

  const confirmEdit = () => {
    if (!editor) return;
    editor.commands.insertContentAt(
      { from: editor.state.selection.from, to: editor.state.selection.to },
      preview.suggestion
    );
    setPreview({ original: "", suggestion: "", open: false });
  };

  return (
    <div className="grid grid-cols-3 h-screen">
      {/* Editor */}
      <div className="col-span-2 p-4 border-r">
        <EditorContent editor={editor} className="prose max-w-none p-2 border rounded" />
        <div className="mt-2">
          <button
            onClick={handleSelectionEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Edit Selection with AI
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="col-span-1 p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto border p-2 rounded">
          {chat.map((c, i) => (
            <div
              key={i}
              className={`mb-2 p-2 rounded ${
                c.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"
              }`}
            >
              <strong>{c.role === "user" ? "You" : "AI"}:</strong> {c.content}
            </div>
          ))}
        </div>
        <div className="mt-2 flex">
          <input
            className="flex-1 border rounded p-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="ml-2 px-4 py-2 bg-green-600 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {preview.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow-lg w-1/2">
            <h2 className="text-lg font-bold mb-2">AI Edit Preview</h2>
            <p><strong>Original:</strong> {preview.original}</p>
            <p className="mt-2"><strong>Suggestion:</strong> {preview.suggestion}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded"
                onClick={() => setPreview({ ...preview, open: false })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={confirmEdit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
