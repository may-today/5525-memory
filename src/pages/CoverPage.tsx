import { useNavigate } from "@tanstack/react-router";

import { TextureOverlay } from "@/components/ui/texture-overlay";
import { Marquee } from "@/components/marquee";
import MaydayIcon from "@/assets/mayday.svg";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

const Logos = () => {
	return (
		<div className="flex flex-row items-center gap-2">
			<div className="px-3 py-2 bg-accent text-xs text-muted-foreground">
				Diu Logo
			</div>
			<div className="px-3 py-2 bg-accent text-xs text-muted-foreground">
				相遇五月天
			</div>
			<div className="px-3 py-2 bg-accent text-xs text-muted-foreground">
				LeseTruck
			</div>
		</div>
	);
};

const NextButton: React.FC<{ onClick: () => void, className?: string }> = ({ onClick, className }) => {
	return (
		<button
			className={clsx(['flex size-24 items-center justify-center rounded-full bg-white font-semibold transition-all text-black hover:scale-105 hover:bg-white/80 active:scale-95', className])}
			onClick={onClick}
			type="button"
		>
			<ArrowRight className="size-10" strokeWidth={2} />
		</button>
	);
};

export function CoverPage() {
	const navigate = useNavigate();

	return (
		<div className="flex min-h-svh flex-col items-stretch justify-stretch">
			<div className="flex-1 relative">
				<TextureOverlay texture="grid" opacity={0.2} className="invert" />
			</div>
			<div className="border-t py-1 font-geist">
				<Marquee>
					<div className="flex flex-row items-baseline gap-2 mx-1">
						<div>MAYDAY 5525</div>
						<img src={MaydayIcon} alt="Mayday Icon" className="size-3.5" />
						<div>MAYDAY 5525+1</div>
						<img src={MaydayIcon} alt="Mayday Icon" className="size-3.5" />
						<div>MAYDAY 5525+2</div>
						<img src={MaydayIcon} alt="Mayday Icon" className="size-3.5" />
					</div>
				</Marquee>
			</div>
			<div className="relative flex flex-col items-start gap-2 border-t px-5 py-6">
				<p className="text-sm text-muted-foreground">
					五月天「5525 回到那一天」
				</p>
				<h1 className="text-5xl font-extrabold font-wjh mb-6">
					你的
					<br />
					时空旅行报告
				</h1>
				<Logos />
				<p className="text-xs text-muted-foreground mt-3">隐私声明 · 感谢名单</p>
				<NextButton className="absolute bottom-8 right-6" onClick={() => navigate({ to: "/form" })} />
				{/* <Button size="lg" onClick={() => navigate("/form")}>
					开始回忆
				</Button> */}
			</div>
		</div>
	);
}
