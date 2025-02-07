import "/src/App.css"
import { useRef, useState, useEffect } from "react";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LM_STUDIO_HOST = 'http://127.0.0.1:1234'
const LM_STUDIO_DEFAULT_MODEL = 'meta-llama-3.1-8b-instruct'

function App() {
  const [text, setText] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([{ id: LM_STUDIO_DEFAULT_MODEL }]);
  const [selectedModel, setSelectedModel] = useState(
    LM_STUDIO_DEFAULT_MODEL
  );
  const controllerRef = useRef(null);

  const getModels = async () => {
    const url = `${LM_STUDIO_HOST}/api/v0/models`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);
      setModels(result.data.filter((item) => item.type === 'llm' && item.state === 'loaded'));
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    getModels();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setIsLoading(true);
      setText("");

      const lmstudio = createOpenAICompatible({
        baseURL: `${LM_STUDIO_HOST}/v1`,
      });

      const result = await streamText({
        model: lmstudio(selectedModel),
        prompt: inputText,
        abortSignal: controller.signal,
      });

      for await (const chunk of result.textStream) {
        setText((prev) => prev + chunk);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error:", error);
        setText(`**Error:** ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      controllerRef.current = null;
    }
  };

  const handleStop = async (e) => {
    e.preventDefault();
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1>LM Chat</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{
            maxWidth: "50%",
            padding: "10px",
            marginBottom: "10px",
            fontSize: "16px",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "4px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
          disabled={isLoading}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your request..."
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            fontSize: "16px",
          }}
          disabled={isLoading}
        />
        <div style={{ display: "flex", flexDirection: "row", gap: "5px" }}>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              backgroundColor: isLoading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Send"}
          </button>
          <button
            type="button"
            onClick={handleStop}
            style={{
              padding: "10px 20px",
              backgroundColor: !isLoading ? "#ccc" : "#9d1c1c",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: !isLoading ? "not-allowed" : "pointer",
            }}
            disabled={!isLoading}
          >
            {"Stop"}
          </button>
        </div>
      </form>

      {text && (
        <div
          style={{
            width: "100%",
            background: "#f5f5f5",
            padding: "10px",
            borderRadius: "8px",
            marginTop: "20px",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ children, ...props }) {
                return (
                  <code
                    {...props}
                    style={{
                      background: "#e9ecef",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                    }}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default App;
