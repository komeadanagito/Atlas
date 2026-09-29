import { useState } from "react";
import { AppNav } from "./shell/AppNav";
import { isKitModule, type SectionId } from "./routes";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import { AuthGate } from "../features/auth/AuthGate";
import { AuthModal } from "../features/auth/AuthModal";
import { ProfilePage } from "../features/auth/ProfilePage";
import { KitHub } from "../features/kit/KitHub";
import { MovementBrowser } from "../features/kit/MovementBrowser";
import { Placeholder } from "../features/kit/Placeholder";
import { TimelinePage } from "../features/timeline/ui/Timeline";

const AppContent = () => {
  const { user, loading, error, retry } = useAuth();
  const [section, setSection] = useState<SectionId>("timeline");
  const navActive = section === "timeline" ? "timeline" : section === "profile" ? "profile" : "kit";

  if (!user && typeof window !== "undefined" && window.location.search.includes("preview=auth")) {
    return <AuthGate />;
  }

  if (!user && !loading && !error) {
    return <AuthGate />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppNav active={navActive} onChange={setSection} />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl xl:max-w-7xl 2xl:max-w-[1440px] flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8 xl:px-12 xl:py-10">
        {loading ? (
          <p role="status" className="text-sm text-pretty text-slate-500">正在恢复登录状态…</p>
        ) : error ? (
          <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}<button onClick={retry} className="ml-4 underline">重试</button></div>
        ) : user ? (
          <>
            {section === "timeline" ? <TimelinePage key={user.id} /> : null}
            {section === "profile" ? <ProfilePage key={`profile-${user.id}`} /> : null}
            {section === "kit" ? (
              // Push the scroll clip edge out into the page padding so tile lift/shadow/ring are not cut off.
              <div className="-mx-4 -mt-4 min-h-0 flex-1 overflow-y-auto px-4 pt-4 soft-scroll">
                <KitHub onOpen={setSection} />
              </div>
            ) : null}
            {isKitModule(section) ? (
              section === "fitness" ? (
                // Bleed into the page padding so rings/shadows on the right edge are not clipped.
                <div className="-mx-4 -mb-2 -mt-2 min-h-0 flex-1 overflow-hidden px-4 pb-2 pt-1 sm:-mt-4">
                  <MovementBrowser onBack={() => setSection("kit")} />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto soft-scroll">
                  <Placeholder id={section} onBack={() => setSection("kit")} />
                </div>
              )
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AuthGate />
          </div>
        )}
      </div>
      <AuthModal />
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;