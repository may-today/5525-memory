import createGlobe from "cobe";
import { useEffect, useRef } from "react";

const showcaseDefaultMarkers = [
  {
    id: 'taoyuan',
    location: [24.99, 121.3],
    label: '桃园',
  },
  {
    id: 'singapore',
    location: [1.21, 103.49],
    label: '新加坡',
  },
  {
    id: 'sydney',
    location: [-33.51, 151.12],
    label: '悉尼',
  },
  {
    id: 'lasvegas',
    location: [36.17, -115.14],
    label: '拉斯维加斯',
  },
  {
    id: 'tianjin',
    location: [39.08, 117.2],
    label: '天津',
  },
  {
    id: 'hongkong',
    location: [22.32, 114.17],
    label: '香港',
  },
  {
    id: 'hangzhou',
    location: [30.16, 120.12],
    label: '杭州',
  },
  {
    id: 'herbin',
    location: [45.75, 126.64],
    label: '哈尔滨',
  },
  {
    id: 'taipei',
    location: [25.02, 121.33],
    label: '台北',
  },
  {
    id: 'beijing',
    location: [39.92, 116.36],
    label: '北京',
  },
  {
    id: 'shanghai',
    location: [31.22, 121.48],
    label: '上海',
  },
  {
    id: 'guiyang',
    location: [26.34, 106.42],
    label: '贵阳',
  },
  {
    id: 'changsha',
    location: [28.11, 112.58],
    label: '长沙',
  },
  {
    id: 'zhengzhou',
    location: [34.45, 113.38],
    label: '郑州',
  },
  {
    id: 'xiamen',
    location: [24.46, 118.1],
    label: '厦门',
  },
  {
    id: 'guangzhou',
    location: [23.16, 113.23],
    label: '广州',
  },
  {
    id: 'taizhong',
    location: [24.08, 120.4],
    label: '台中',
  }
] as { id: string; location: [number, number]; label: string }[]

export function SummaryCardCity() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		let phi = 0;

		const globe = createGlobe(canvasRef.current, {
			devicePixelRatio: 2,
			width: 600 * 2,
			height: 600 * 2,
			phi: 0,
			theta: 0.2,
			dark: 1.1,
			diffuse: 1.8,
			mapSamples: 16000,
			mapBrightness: 6,
			glowColor: [0.1, 0.1, 0.1],
			// baseColor: [1, 1, 1],
			// markerColor: [0.2, 0.4, 1],
			// glowColor: [1, 1, 1],
			markers: showcaseDefaultMarkers,
			// arcs: [{ from: [37.78, -122.44], to: [40.71, -74.01] }],
			// arcColor: [0.3, 0.5, 1],
			// arcWidth: 0.5,
			// arcHeight: 0.3,
			// onRender: (state) => {
			// 	// Called on every animation frame.
			// 	// `state` will be an empty object, return updated params.
			// 	state.phi = phi;
			// 	phi += 0.01;
			// },
		});

		function animate() {
			phi += 0.003;
			globe.update({ phi });
			requestAnimationFrame(animate);
		}
		animate();

		return () => {
			globe.destroy();
		};
	}, []);

	return (
		<div className="flex min-h-svh flex-col p-6">
			<p className="mb-4 text-xs tracking-widest text-muted-foreground uppercase">
				01 / 场次信息-地图视角
			</p>
			{/* <h3 className="mb-8 text-2xl font-bold">场次信息-地图视角</h3> */}

			<div className="flex flex-col gap-4">
				<div className="summary-globe-container">
					<canvas ref={canvasRef} className="summary-globe-canvas" />
					<div className="summary-globe-orbit-ring" aria-hidden="true">
						<svg className="summary-globe-orbit-svg" viewBox="0 0 300 300">
							<defs>
								<path
									id="orbitPath"
									d="M 150,150 m -130,0 a 130,130 0 1,0 260,0 a 130,130 0 1,0 -260,0"
								/>
							</defs>
							<text className="summary-globe-orbit-text">
								<textPath href="#orbitPath">
									{"5525 MAYDAY · ".repeat(14)}
								</textPath>
							</text>
						</svg>
					</div>
					{showcaseDefaultMarkers.map((m) => (
						<div
							key={m.id}
							className="summary-globe-marker-label"
							style={
								{
									positionAnchor: `--cobe-${m.id}`,
									opacity: `var(--cobe-visible-${m.id}, 0)`,
									filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
								} as React.CSSProperties
							}
						>
							{m.label}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
