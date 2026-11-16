import { Fragment } from 'react'
import { headingLines } from '../../lib/heading'
import SplitText from './SplitText'

/**
 * The Home hero's heading, from the dashboard's words: each line revealed word
 * by word, a beat after the line before, and a word written *like this* in
 * gold italic, as "of Malaysia" is.
 *
 * SplitText sets its words in inline blocks, and an inline block swallows a
 * space at its edge, so the spaces around a gold word are written outside it.
 */
export default function HeroHeading({ text }: { text: string }) {
  return (
    <>
      {headingLines(text).map((runs, line) => (
        <Fragment key={line}>
          {line > 0 && (
            <>
              {' '}
              <br />
            </>
          )}
          {runs.map((run, i) => {
            const words = run.text.trim()
            if (!words) return <Fragment key={i}>{run.text ? ' ' : ''}</Fragment>
            const split = <SplitText text={words} delay={0.35 * line} />
            return (
              <Fragment key={i}>
                {run.text !== run.text.trimStart() && ' '}
                {run.accent ? <span className="italic text-gilt">{split}</span> : split}
                {run.text !== run.text.trimEnd() && ' '}
              </Fragment>
            )
          })}
        </Fragment>
      ))}
    </>
  )
}
