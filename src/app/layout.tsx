import './globals.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aarambh Library",
  description: "Modern library management system for students and administrators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.addEventListener('error', function(e) {
                  var msg = (e && e.message) || '';
                  if (
                    msg.indexOf('module factory is not available') !== -1 ||
                    msg.indexOf('Loading chunk') !== -1 ||
                    msg.indexOf('was instantiated because it was required') !== -1 ||
                    msg.indexOf('ChunkLoadError') !== -1
                  ) {
                    var key = '__stale_chunk_reload';
                    var last = sessionStorage.getItem(key);
                    var now = Date.now();
                    if (!last || (now - parseInt(last, 10)) > 8000) {
                      sessionStorage.setItem(key, now.toString());
                      window.location.reload();
                    }
                  }
                });
              })();
            `
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
