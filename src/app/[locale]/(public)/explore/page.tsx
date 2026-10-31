import { Suspense } from "react";

import { ExploreView } from "./explore-view";
import { ExploreSkeleton } from "./explore-skeleton";

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreView />
    </Suspense>
  );
}
