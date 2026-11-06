import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/carousel/styles.css';
import type { Route } from "./+types/root";
import "./app.css";
import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps } from '@mantine/core';
import iconImage from "/images/icon.png";
import { store } from './store/store';
import { Provider } from 'react-redux';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import LoadingIndicator from "./components/general/LoadingIndicator";
import { Suspense } from "react";
import { seo } from "./services/seo";
import NavigationProgress from "./components/general/NavigationProgress";

// Site-wide defaults: baked into the SPA's index.html (what link-preview bots read) and used by routes without their own meta
export function meta() {
  return seo();
}

export function HydrateFallback() {
  return <LoadingIndicator />;
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    as: "style",
    href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap",
  },
  // PWA Core Assets
  { rel: "manifest", href: "/manifest.json" },
  { rel: "apple-touch-icon", href: "/images/icon.png" },
  { rel: "shortcut icon", href: iconImage, type: "image/x-icon" }
];

const queryClient = new QueryClient();

const theme = createTheme({
  fontFamily: 'Nunito',
  headings: {
    fontFamily: 'Nunito',
  },
});

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <html lang="en" {...mantineHtmlProps}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

          <meta name="theme-color" content="#228be6" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="HolidayWaka" />
          <meta name="mobile-web-app-capable" content="yes" />

          <ColorSchemeScript />
          <Meta />
          <Links />
          <script src="//padorix-main-widget.onrender.com/widget.iife.js" data-id="e8fed703-de47-4168-9762-2b190b209c51" data-display="floating"></script>
        </head>
        <body className="scrolls body">
          <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme}>
              <div className="text-primary bg-background">
                {children}
              </div>
            </MantineProvider>
          </QueryClientProvider>
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </Provider>
  );
}

export default function App() {
  return (
    <Suspense fallback={<HydrateFallback />}>
      <NavigationProgress />
      <Outlet />
    </Suspense>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}