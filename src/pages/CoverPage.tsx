import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import MaydayLiveLogo from '@/assets/logo/maydaylive.webp'
import OctoCraftLogo from '@/assets/logo/octocraft.webp'
import MaydayIcon from '@/assets/mayday.svg'
import { CoverBackground } from '@/components/cover-background'
import { Marquee } from '@/components/marquee'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { hasVisitedSharePage } from '@/lib/share-page-visit'

const rootRouteApi = getRouteApi('__root__')

const PrivacyStatement = () => (
  <Sheet>
    <SheetTrigger className="px-2 py-1 font-title transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none">
      [ 隐私声明 ]
    </SheetTrigger>
    <SheetContent className="max-h-[80svh] rounded-t-2xl" side="bottom">
      <SheetHeader className="border-b px-5 pt-6 pb-4">
        <SheetTitle className="font-title text-xl">隐私声明</SheetTitle>
        <SheetDescription>你的回忆，应该只属于你。</SheetDescription>
      </SheetHeader>
      <div className="overflow-y-auto px-5 py-5 text-sm leading-7">
        <div className="flex flex-col gap-4">
          <p>
            「五月天 5525
            你的时空旅行报告」不要求你提供真实姓名、地址、联系方式、社群账号或付款资讯。表单中填写的昵称、所在地区、可选定位坐标与已选演出场次，会保存在你目前使用的浏览器本机，以便你回到页面时继续这趟回忆。
          </p>
          <p>
            若你选择授权定位，坐标会保存在本机；当你生成统计回顾时，网页会将它连同已选场次编号与所在地区传送至服务器，仅用于计算你往返各巡演城市的奔波距离。若未授权定位，则会使用你选择的所在地区中心点计算。你可以随时在浏览器的网站资料或本地储存设置中清除以上内容。
          </p>
          <p>
            服务器会在本次统计请求中使用所在地区或定位坐标计算距离，不会将这些地点资讯写入巡演资料库或另行保存；昵称不会传送至服务器。
          </p>
          <p>
            当你提交场次（包括预热期间的提前填写）时，网页会另行建立一笔匿名统计登记：服务器会保存随机产生的报告识别码、登记时间，以及你选择的演出场次编号。这些资料只用于计算「第几位登记巡演回忆的人」与各场次的匿名同场人数；不会包含昵称、所在地区、定位坐标、真实姓名或联系方式，也不会用来识别你本人。
          </p>
          <p>
            该匿名识别码也会暂存在你的浏览器，以便网络中断或页面重整后安全重试，而不会重复计数。若你在浏览器清除网站资料，浏览器端的资料与识别码会一并清除；已经完成的匿名统计登记不会因此回溯关联到你的身分。
          </p>
          <p>
            使用「你的专属报告／数据电台」时，已选场次编号与您输入的问题会传送至服务器。服务器会从巡演资料库计算所需的汇总数据，再将问题与这些汇总结果交由已配置的
            OpenAI-compatible AI 服务生成回答。该 AI 服务不会直接收到昵称、所在地区、定位坐标或原始场次编号。
          </p>
          <p>
            本声明描述目前网页程式的资料流向；AI
            服务及部署服务对请求资料的保留与处理，仍分别适用其服务条款与隐私政策。若未来调整资料处理方式，本声明也会同步更新。
          </p>
        </div>
      </div>
    </SheetContent>
  </Sheet>
)

const Credits = () => (
  <Sheet>
    <SheetTrigger className="px-2 py-1 font-title transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none">
      [ 感谢名单 ]
    </SheetTrigger>
    <SheetContent className="max-h-[80svh] rounded-t-2xl" side="bottom">
      <SheetHeader className="border-b px-5 pt-6 pb-4">
        <SheetTitle className="font-title text-xl">感谢名单</SheetTitle>
        <SheetDescription>也要和你举起回忆酿的甜 / 和你再干一杯</SheetDescription>
      </SheetHeader>
      <div className="overflow-y-auto px-5 py-5 text-sm leading-7">
        <div className="flex flex-col gap-4">
          <p>
            该报告由{' '}
            <a className="underline" href="https://ddiu.io" rel="noopener" target="_blank">
              Diu
            </a>{' '}
            制作并在小红书宣发，相遇五月天、OctoCraft 提供巡演场次歌单数据与设计支持。
          </p>
          <p>
            谢谢参与整理公开巡演资讯、歌单记录与现场片段的所有朋友。每一笔日期、每一首歌、每一次特别相遇，才得以在这里成为可以回看的时空坐标。
          </p>
          <p>
            「五月天 5525 时空旅行报告」
            为粉丝制作的非官方回顾网页，与五月天、相信音乐及巡演主办单位没有隶属关系。相关名称、作品与影像权利仍分别属于其权利人。
          </p>
          <p>数据及素材支持：</p>
          <ul className="list-inside list-disc">
            <li>巡演场次歌单数据由 相遇五月天 授权提供，感谢在背后贡献歌单场次数据的 wmls</li>
            <li>专辑及嘉宾图片来自互联网</li>
            <li>「专属回忆」环节来自于小红书全体 wmls</li>
            <li>封面滚动素材由专辑封面经 Gemini 二次加工处理</li>
            <li>贴纸、图标等所有小图素材均由 Gemini 生成</li>
          </ul>
          <p>技术信息：</p>
          <ul className="list-inside list-disc">
            <li>
              源代码：
              <a className="underline" href="https://github.com/may-today/5525-memory" rel="noopener" target="_blank">
                may-today/5525-memory
              </a>
            </li>
            <li>
              字体：Doto、字体圈伟君黑、寒蝉德黑体（由 Fontmin、
              <a className="underline" href="https://chinese-font.netlify.app/zh-cn/" rel="noopener" target="_blank">
                中文网字计划
              </a>{' '}
              提供字体切片支持）
            </li>
          </ul>
        </div>
      </div>
    </SheetContent>
  </Sheet>
)

const Logos = () => (
  <div className="flex flex-row items-center gap-1.5">
    {/*<img alt="Diu Logo" className="h-5 w-auto" height={32} src={DiuLogo} width={32} />*/}
    <span className="text-xs">@Diu</span>
    <span className="text-muted-foreground text-sm">×</span>
    <img alt="Mayday Live Logo" className="h-4.5 w-auto" height={32} src={MaydayLiveLogo} width={32} />
    <span className="text-muted-foreground text-sm">×</span>
    <img alt="OctoCraft Logo" className="h-5 w-auto" height={32} src={OctoCraftLogo} width={32} />
  </div>
)

const NextButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
  <button
    className={clsx([
      'flex size-24 items-center justify-center rounded-full bg-white font-semibold text-black transition-all hover:scale-105 hover:bg-white/80 active:scale-95',
      className,
    ])}
    onClick={onClick}
    type="button"
  >
    <ArrowRight className="size-10" strokeWidth={2} />
  </button>
)

export function CoverPage() {
  const navigate = useNavigate()
  const { staticFileHost } = rootRouteApi.useLoaderData()
  const [hasVisitedShare, setHasVisitedShare] = useState(false)

  useEffect(() => {
    setHasVisitedShare(hasVisitedSharePage())
  }, [])

  return (
    <div className="relative flex min-h-svh flex-col items-stretch justify-stretch">
      <CoverBackground staticFileHost={staticFileHost} />
      <div className="flex-1" />
      <div className="relative border-t bg-background/55 py-1 font-geist">
        <Marquee>
          <div className="mx-1 flex flex-row items-baseline gap-2">
            <div>MAYDAY 5525</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
            <div>MAYDAY 5525+1</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
            <div>MAYDAY 5525+2</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
          </div>
        </Marquee>
      </div>
      <div className="relative flex flex-col items-start gap-2 border-t bg-linear-to-b bg-transparent from-background/65 to-33% to-background px-5 py-6">
        <p className="text-muted-foreground text-sm">五月天「5525 回到那一天」</p>
        <h1 className="mb-6 font-extrabold font-wjh text-5xl">
          你的
          <br />
          时空旅行报告
        </h1>
        <Logos />
        {hasVisitedShare ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex min-h-10 items-center rounded-full border border-white/20 bg-white/8 px-4 font-medium text-foreground text-sm transition-colors hover:border-white/40 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
              to="/share"
            >
              回顾分享页
            </Link>
            <Link
              className="inline-flex min-h-10 items-center rounded-full border border-white/20 bg-white/8 px-4 font-medium text-foreground text-sm transition-colors hover:border-white/40 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
              to="/records"
            >
              5525 巡回记录
            </Link>
          </div>
        ) : null}
        <p className="mt-2 -ml-1 flex items-center text-muted-foreground text-xs">
          <PrivacyStatement />
          <Credits />
        </p>
        <NextButton className="absolute right-6 bottom-8" onClick={() => navigate({ to: '/form' })} />
      </div>
    </div>
  )
}
