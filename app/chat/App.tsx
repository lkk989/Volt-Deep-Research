// app/chat/App.tsx This is example code for a React application that integrates VoltAgent with CopilotKit.
import { useMemo } from "react";
import {
  CopilotKit,
  useCopilotAction,
  useFrontendTool,
  useHumanInTheLoop,
} from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

function WeatherAction() {
  useCopilotAction({
    name: "getWeather",
    available: "disabled", // UI render only
    render: ({ status, args, result }) => (
      <div className="text-gray-500 mt-2">
        {status !== "complete" && "Calling weather API..."}
        {status === "complete" && (
          <>
            <p>Called weather API for {args?.location}</p>
            {(Boolean(((result as { message?: string })?.message))) && <p>{(result as { message?: string }).message}</p>}
          </>
        )}
      </div>
    ),
  });
  return null;
}

function FrontendTools() {
  useFrontendTool({
    name: "sayHello",
    description: "Say hello to the user",
    parameters: [{ name: "name", type: "string", required: true }],
    handler: ({ name }) => ({ currentURLPath: window.location.href, userName: name }),
    render: ({ args }) => (
      <div style={{ marginTop: 8 }}>
        <h3>Hello, {args.name}!</h3>
        <p>You're currently on {window.location.href}</p>
      </div>
    ),
  });

  useHumanInTheLoop({
    name: "offerOptions",
    description: "Let the user pick between two options.",
    parameters: [
      { name: "option_1", type: "string", required: true },
      { name: "option_2", type: "string", required: true },
    ],
    render: ({ args, respond }) => (
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => respond?.(`${args.option_1} was selected`)}>{args.option_1}</button>
        <button onClick={() => respond?.(`${args.option_2} was selected`)}>{args.option_2}</button>
      </div>
    ),
  });

  return null;
}

export default function App() {
  const runtimeUrl = useMemo(
    () => ((process.env as { VITE_RUNTIME_URL?: string }).VITE_RUNTIME_URL as string) ?? "http://localhost:3141/copilotkit",
    []
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "2rem" }}>
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <h1 style={{ marginBottom: 12 }}>VoltAgent + CopilotKit</h1>
        <p style={{ marginTop: 0, color: "#475569" }}>
          Connects to the VoltAgent CopilotKit endpoint at {runtimeUrl}.
        </p>
        {/* Agent selection can be managed via CopilotKit DevTools; omit agent to allow switching. */}
        <CopilotKit runtimeUrl={runtimeUrl}>
          <WeatherAction />
          <FrontendTools />
          <CopilotChat
            className="copilot-kit-chat"
            labels={{ initial: "Hi! How can I assist you today?", title: "Your Assistant" }}
          />
        </CopilotKit>
      </div>
    </div>
  );
}
