import clsx from 'clsx'

const longBackgroundNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const verticalCopies = ['first', 'second']

interface CoverBackgroundRowsProps {
  staticFileHost: string
}

function CoverBackgroundRows({ staticFileHost }: CoverBackgroundRowsProps) {
  const assetHost = staticFileHost.endsWith('/') ? staticFileHost.slice(0, -1) : staticFileHost

  return longBackgroundNumbers.map((backgroundNumber, index) => {
    const source = `${assetHost}/5525/cover/longbg/${backgroundNumber}.webp`

    return (
    <div className="cover-background-row" key={backgroundNumber}>
      <div
        className={clsx(
          'cover-background-strip',
          index % 2 === 0 ? 'cover-background-strip--right' : 'cover-background-strip--left'
        )}
      >
        {[0, 1, 2].map((copy) => (
          <img alt="" className="cover-background-image" height={139} key={copy} src={source} width={1000} />
        ))}
      </div>
    </div>
    )
  })
}

interface CoverBackgroundProps {
  staticFileHost: string
}

/** Animated seamless background used in the cover's opening panel. */
export function CoverBackground({ staticFileHost }: CoverBackgroundProps) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="cover-background-vertical-track">
        {verticalCopies.map((copy) => (
          <div className="cover-background-group" key={copy}>
            <CoverBackgroundRows staticFileHost={staticFileHost} />
          </div>
        ))}
      </div>
      <div className="cover-background-fade" />
    </div>
  )
}
