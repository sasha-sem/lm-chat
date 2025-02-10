import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";

export function Message(props) {
    const [text, setText] = useState("");
    const prompt = props.prompt;

    useEffect(() => {
        const handleStream = async () => {
            try {
                if (props.stream.locked) return;
                for await (const chunk of props.stream) {
                    setText((prev) => prev + chunk);
                }
            }
            catch (error) {
                props.handleError(error)
            }

        }
        handleStream()
    }, [props])

    return (
        <> {text &&
            <div
                style={{
                    width: "100%",
                    background: "#f5f5f5",
                    padding: "10px",
                    paddingTop: "2px",
                    borderRadius: "8px",
                    marginTop: "20px",
                }}
            >
                <p style={{ width: "fit-content", padding: "4px", borderRadius: "4px", fontSize: "16px", background: "#cacbcf" }}><strong> Assistant</strong></p>
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
        }
            <div
                style={{
                    width: "100%",
                    background: "#f5f5f5",
                    padding: "10px",
                    paddingTop: "2px",
                    borderRadius: "8px",
                    marginTop: "20px",
                }}
            >
                <p style={{
                    width: "fit-content",
                    padding: "4px",
                    borderRadius: "4px",
                    fontSize: "16px",
                    background: "#cacbcf"
                }}>
                    <strong> You </strong>
                </p>
                <p>{prompt}</p>
            </div>
        </>
    );
}

Message.propTypes = {
    stream: PropTypes.array,
    prompt: PropTypes.string,
    handleError: PropTypes.func
};
