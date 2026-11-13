import { addColumn, removeColumn, type TableBlock } from './blocks'
import { ListEditor } from './fields'
import { danger, small } from './styles'
import { hasLongDash, replaceLongDashes } from './text'

const cell =
  'block w-full min-w-0 border-b border-line bg-transparent py-1.5 text-sm text-ink outline-none transition focus:border-gold disabled:opacity-60'

/**
 * A table in an article: its column headings, then its rows, each a cell per
 * column. Columns are added or taken away at the end, across every row at
 * once, so a row can never come out short of a cell.
 */
export default function TableField({
  table, onChange, err, disabled,
}: {
  table: TableBlock
  onChange: (next: TableBlock) => void
  /** The message for a path inside this table, such as `rows.1` or `head.0`. */
  err: (path: string) => string | undefined
  disabled?: boolean
}) {
  const columns = table.head.length
  const grid = { display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '0.75rem' }
  const headError = err('head') ?? table.head.map((_, c) => err(`head.${c}`)).find(Boolean)
  const dashed = [...table.head, ...table.rows.flat()].some(hasLongDash)

  return (
    <div className="space-y-3">
      <div>
        <span className="eyebrow text-smoke">Column headings</span>
        <div style={grid} className="mt-1">
          {table.head.map((heading, c) => (
            <input
              key={c}
              aria-label={`Heading of column ${c + 1}`}
              value={heading}
              disabled={disabled}
              onChange={(e) => onChange({ ...table, head: table.head.map((h, k) => (k === c ? e.target.value : h)) })}
              className={cell}
            />
          ))}
        </div>
        {headError && <p className={`mt-1 text-xs ${danger}`}>{headError}</p>}
      </div>

      <ListEditor<string[]>
        items={table.rows}
        onChange={(rows) => onChange({ ...table, rows })}
        blank={() => table.head.map(() => '')}
        addLabel="Add a row"
        itemLabel={(_, r) => `Row ${r + 1}`}
        disabled={disabled}
        render={(row, update, r) => {
          const rowError = err(`rows.${r}`) ?? row.map((_, c) => err(`rows.${r}.${c}`)).find(Boolean)
          return (
            <>
              <div style={grid}>
                {row.map((value, c) => (
                  <input
                    key={c}
                    aria-label={`Row ${r + 1}, column ${c + 1}`}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => update(row.map((v, k) => (k === c ? e.target.value : v)))}
                    className={cell}
                  />
                ))}
              </div>
              {rowError && <p className={`text-xs ${danger}`}>{rowError}</p>}
            </>
          )
        }}
      />
      {err('rows') && <p className={`text-xs ${danger}`}>{err('rows')}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={disabled || columns >= 6} onClick={() => onChange(addColumn(table))} className={small}>
          Add a column
        </button>
        <button type="button" disabled={disabled || columns <= 1} onClick={() => onChange(removeColumn(table))} className={small}>
          Remove last column
        </button>
      </div>

      {dashed && (
        <p className="text-xs text-gold-deep">
          House style avoids long dashes.{' '}
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...table,
                head: table.head.map(replaceLongDashes),
                rows: table.rows.map((row) => row.map(replaceLongDashes)),
              })
            }
            className="underline"
          >
            Use commas
          </button>
        </p>
      )}
    </div>
  )
}
