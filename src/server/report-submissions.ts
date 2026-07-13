import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from './db'

const ReportSubmissionSchema = z.object({
  showIds: z.array(z.number().int().positive()).min(1).max(200),
  submissionId: z.string().uuid(),
})

interface ReportNumberRow {
  id: number
}

interface FellowFanRow {
  fellow_fans: number
  show_id: number
}

/** Anonymous report-registration metrics returned to the browser that created the report. */
export interface ReportSubmissionStats {
  fellowFansByShowId: Record<number, number>
  reportNumber: number
  submissionId: string
}

/** Removes duplicate show IDs while retaining predictable parameter ordering. */
function getUniqueShowIds(showIds: number[]): number[] {
  return [...new Set(showIds)].toSorted((a, b) => a - b)
}

/** Verifies that every requested show is currently available for public selection. */
async function hasVisibleShows(db: D1Database, showIds: number[]): Promise<boolean> {
  const placeholders = showIds.map(() => '?').join(',')
  const result = await db
    .prepare(`SELECT COUNT(*) AS count FROM shows WHERE is_hidden = 0 AND id IN (${placeholders})`)
    .bind(...showIds)
    .first<{ count: number }>()
  return result?.count === showIds.length
}

/**
 * Stores a report registration exactly once and returns its stable ordinal plus
 * same-show counts. The batch is atomic: a failed association insert cannot
 * leave an orphan report row behind.
 */
export const registerReportSubmission = createServerFn({ method: 'POST' })
  .validator((request: unknown) => ReportSubmissionSchema.parse(request))
  .handler(async ({ data }): Promise<ReportSubmissionStats> => {
    const db = await getDb()
    const showIds = getUniqueShowIds(data.showIds)

    if (!(await hasVisibleShows(db, showIds))) {
      throw new Error('包含不可用的场次，请重新选择后再生成。')
    }

    const placeholders = showIds.map(() => '?').join(',')
    const statements = [
      db.prepare('INSERT OR IGNORE INTO report_submissions (submission_id) VALUES (?)').bind(data.submissionId),
      ...showIds.map((showId) =>
        db
          .prepare('INSERT OR IGNORE INTO report_submission_shows (submission_id, show_id) VALUES (?, ?)')
          .bind(data.submissionId, showId)
      ),
      db.prepare('SELECT id FROM report_submissions WHERE submission_id = ?').bind(data.submissionId),
      db
        .prepare(
          `SELECT show_id, COUNT(*) AS fellow_fans
           FROM report_submission_shows
           WHERE show_id IN (${placeholders})
           GROUP BY show_id`
        )
        .bind(...showIds),
    ]
    const results = await db.batch(statements)
    const reportResult = results.at(-2)
    const fellowFansResult = results.at(-1)
    const reportNumber = (reportResult?.results[0] as ReportNumberRow | undefined)?.id

    if (!reportNumber) {
      throw new Error('报告登记未完成，请重试。')
    }

    const fellowFansByShowId: Record<number, number> = {}
    for (const row of fellowFansResult?.results ?? []) {
      const fellowFanRow = row as FellowFanRow
      fellowFansByShowId[fellowFanRow.show_id] = fellowFanRow.fellow_fans
    }

    return { fellowFansByShowId, reportNumber, submissionId: data.submissionId }
  })
