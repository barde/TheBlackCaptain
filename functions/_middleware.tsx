import React from "react";
import vercelOGPagesPlugin from "@cloudflare/pages-plugin-vercel-og";

interface Props {
  title: string;
  description: string;
}

export const onRequest = vercelOGPagesPlugin<Props>({
  imagePathSuffix: "/og-image.png",
  component: ({ title, description }) => {
    const displayTitle = title || "The Black Captain";
    const displayDescription = description || "A journey of healing through words";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1a2332 0%, #2c3e50 50%, #34495e 100%)",
          padding: "80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Header - Pirate Flag Symbol */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              marginRight: "30px",
            }}
          >
            🏴‍☠️
          </div>
          <div
            style={{
              fontSize: "36px",
              color: "#ecf0f1",
              fontWeight: "bold",
              letterSpacing: "2px",
            }}
          >
            THE BLACK CAPTAIN
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              color: "#ffffff",
              lineHeight: 1.2,
              marginBottom: "30px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {displayTitle}
          </div>

          {displayDescription && (
            <div
              style={{
                fontSize: "32px",
                color: "#bdc3c7",
                lineHeight: 1.4,
                fontStyle: "italic",
              }}
            >
              {displayDescription}
            </div>
          )}
        </div>

        {/* Footer - Signature */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "40px",
            borderTop: "2px solid rgba(236, 240, 241, 0.3)",
            paddingTop: "30px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              color: "#95a5a6",
              fontStyle: "italic",
            }}
          >
            Fair winds and following seas
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "#ecf0f1",
              fontWeight: "bold",
              letterSpacing: "8px",
            }}
          >
            ✕ ✕ ✕
          </div>
        </div>
      </div>
    );
  },
  extractors: {
    on: {
      'meta[property="og:title"]': (props) => ({
        element(element) {
          props.title = element.getAttribute("content") || "";
        },
      }),
      'meta[name="description"]': (props) => ({
        element(element) {
          props.description = element.getAttribute("content") || "";
        },
      }),
      'title': (props) => ({
        element(element) {
          // Fallback to page title if og:title is not set
          if (!props.title) {
            props.title = element.textContent || "";
          }
        },
      }),
    },
  },
  autoInject: {
    openGraph: true,
  },
});
