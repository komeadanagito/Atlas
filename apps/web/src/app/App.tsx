import { useState } from "react";
import { AppNav } from "./shell/AppNav";
import { isKitModule, type SectionId } from "./routes";
import { KitHub } from "../features/kit/KitHub";
import { Placeholder } from "../features/kit/Placeholder";
import { TimelinePage } from "../features/timeline/ui/Timeline";

const App = () => {
  const [section, setSection] = useState<SectionId>("timeline");
  const navActive = section === "timeline" ? "timeline" : "kit";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <AppNav active={navActive} onChange={setSection} />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
        {section === "timeline" ? <TimelinePage /> : null}
        {section === "kit" ? (
          <div className="min-h-0 flex-1 overflow-y-auto soft-scroll">
            <KitHub onOpen={setSection} />
          </div>
        ) : null}
        {isKitModule(section) ? (
          <div className="min-h-0 flex-1 overflow-y-auto soft-scroll">
            <Placeholder id={section} onBack={() => setSection("kit")} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default App;