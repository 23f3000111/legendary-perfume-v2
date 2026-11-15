import { Fragment } from 'react'
import { headingLines } from '../../lib/heading'

/**
 * A page heading from the dashboard's words: each line on its own line, and a
 * word written *like this* in the section's accent (gold italic by default).
 * `flat` keeps it on one line, for a setting that never broke, such as the
 * collections heading on a phone.
 */
export default function Heading({
  text,
  accentClass = 'italic text-gilt',
  flat = false,
}: {
  text: string
  accentClass?: string
  flat?: boolean
}) {
  return (
    <>
      {headingLines(text).map((runs, i) => (
        <Fragment key={i}>
          {i > 0 && (flat ? ' ' : <br />)}
          {runs.map((run, j) =>
            run.accent ? (
              <span key={j} className={accentClass}>
                {run.text}
              </span>
            ) : (
              <Fragment key={j}>{run.text}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  )
}
