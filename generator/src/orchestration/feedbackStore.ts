import * as fs from 'fs';
import * as path from 'path';

export type FeedbackType = 'bug' | 'request';

export interface FeedbackRecord {
  feedbackId: string;
  requestId: string;
  createdAt: string;
  type: FeedbackType;
  userId: string;
  title: string;
  description: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

function getFeedbackDir(type: FeedbackType): string {
  const leaf = type === 'bug' ? 'bugs' : 'requests';
  return path.resolve(process.cwd(), 'logs', 'feedback', leaf);
}

export function persistFeedback(record: FeedbackRecord): { absolutePath: string; relativePath: string } {
  const dir = getFeedbackDir(record.type);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${record.feedbackId}.json`;
  const absolutePath = path.join(dir, filename);
  fs.writeFileSync(absolutePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
  const relativePath = path.relative(process.cwd(), absolutePath);
  return { absolutePath, relativePath };
}
