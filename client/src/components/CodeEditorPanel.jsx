import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditorPanel({ onSubmit, onRun }) {
  // ✅ Correct syntax
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(`# Write your Python or C code here\n`);
  const editorRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleSubmit = () => {
    if (onSubmit) onSubmit(code, language);
  };

  const handleRun = () => {
    if (onRun) onRun(code, language);
  };

  const sampleTemplates = {
    python: `def main():
    print("Hello, world!")

if __name__ == "__main__":
    main()
`,
    c: `#include <stdio.h>

int main() {
    printf("Hello, world!\\n");
    return 0;
}
`,
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(sampleTemplates[lang]);
  };

  return (
    <div className="flex flex-col w-full h-full bg-neutral-950 text-white rounded-2xl shadow-xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Code Editor</h2>
        <div className="flex space-x-2 items-center">
          <select
            className="bg-neutral-800 text-white rounded-lg p-2 border border-neutral-700"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="c">C</option>
          </select>
          <button
            className="px-3 py-1 rounded-lg border border-neutral-700 hover:bg-neutral-800"
            onClick={handleRun}
          >
            Run
          </button>
          <button
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="flex-1 border border-neutral-700 rounded-xl overflow-hidden">
        <Editor
          height="500px"
          theme="vs-dark"
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 10 },
          }}
        />
      </div>
    </div>
  );
}
