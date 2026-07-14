import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Show } from "@/types";

interface SetlistImageOverlayProps {
	/** 关闭弹层（Esc / 关闭按钮）。 */
	onClose: () => void;
	/** 要展示歌单长图的场次，`playlistImg` 必须非空。 */
	show: Show;
}

type ImageLoadState = "error" | "loading" | "ready";

function getSetlistImageUrl(playlistImg: string) {
	try {
		const url = new URL(playlistImg);
		if (
			url.hostname === "sinaimg.cn" ||
			url.hostname.endsWith(".sinaimg.cn")
		) {
			url.host = "sinaimg-proxy.ddiu.io";
		}
		return url.toString();
	} catch {
		return playlistImg;
	}
}

/**
 * 歌单长图全屏弹层：顶部信息条 + 纵向滚动的长图区。
 */
export function SetlistImageOverlay({
	onClose,
	show,
}: SetlistImageOverlayProps) {
	const [loadState, setLoadState] = useState<ImageLoadState>("loading");
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const setlistImageUrl = getSetlistImageUrl(show.playlistImg);

	useEffect(() => {
		closeButtonRef.current?.focus();
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

	return (
		<div
			aria-label={`${show.city} ${show.dayLabel} 歌单`}
			aria-modal="true"
			className="records-overlay fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-sm"
			role="dialog"
		>
			<header className="flex shrink-0 items-center justify-between gap-3 border-white/10 border-b px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
				<div className="min-w-0">
					<p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">
						Setlist
					</p>
					<h2 className="mt-0.5 truncate font-title text-base text-zinc-100">
						{show.city} {show.dayLabel} ·{" "}
						<span className="font-geist">{show.dateSlash}</span>
					</h2>
				</div>
				<button
					aria-label="关闭歌单"
					className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-200"
					onClick={onClose}
					ref={closeButtonRef}
					type="button"
				>
					<X className="size-4" />
				</button>
			</header>

			<div className="records-overlay-body min-h-0 flex-1 overflow-y-auto overscroll-contain">
				{loadState === "loading" && (
					<p className="animate-pulse py-24 text-center text-sm text-zinc-500">
						正在展开歌单长图…
					</p>
				)}
				{loadState === "error" && (
					<div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
						<p className="text-sm text-zinc-400">歌单图片没能加载出来。</p>
						<a
							className="text-sm text-zinc-200 underline underline-offset-4"
							href={setlistImageUrl}
							rel="noreferrer"
							target="_blank"
						>
							在新窗口打开原图
						</a>
					</div>
				)}
				{/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: onLoad/onError 只驱动加载状态，不是交互 */}
				<img
					alt={`${show.city} ${show.dayLabel} 歌单长图`}
					className={
						loadState === "error"
							? "hidden"
							: "mx-auto h-auto w-[calc(100%-3rem)] max-w-md"
					}
					height={5}
					onError={() => setLoadState("error")}
					onLoad={() => setLoadState("ready")}
					referrerPolicy="no-referrer"
					src={setlistImageUrl}
					width={3}
				/>
				{loadState === "ready" && show.contributor && (
					<p className="px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-zinc-600">
						歌单整理 · {show.contributor}
					</p>
				)}
			</div>
		</div>
	);
}
