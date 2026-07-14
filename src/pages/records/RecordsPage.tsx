import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { RecordsTimeline } from "./RecordsTimeline";

const routeApi = getRouteApi("/records");

export function RecordsPage() {
	const navigate = useNavigate();
	const allShows = routeApi.useLoaderData();

	return (
		<div className="min-h-svh bg-zinc-950 text-zinc-100">
			<div className="mx-auto w-full max-w-md px-6 pb-24">
				<header className="flex items-center pt-[max(1.25rem,env(safe-area-inset-top))]">
					<button
						aria-label="返回"
						className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-200"
						onClick={() => navigate({ to: "/share" })}
						type="button"
					>
						<ChevronLeft className="size-4" />
					</button>
				</header>

				<RecordsTimeline allShows={allShows} />
			</div>
		</div>
	);
}
