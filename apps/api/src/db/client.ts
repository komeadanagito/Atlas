import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "../../data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, "atlas.sqlite"));
db.exec(readFileSync(join(here, "schema.sql"), "utf8"));
db.exec(`
  DELETE FROM timeline_items WHERE title IN (
    '晨跑 · 滨江道',
    '写类型体操笔记',
    '午饭后散步',
    '整理本周安排',
    '力量训练',
    '晚上阅读',
    '英语精读',
    '拉伸',
    '算法作业',
    '慢跑 4 km',
    'TypeScript 类型体操',
    '时间轴的信息架构',
    '晚上读了半小时',
    '拉伸与泡沫轴',
    '算法课作业',
    '整理书桌',
    '摘录：注意力残差',
    '下肢力量',
    '蛋白质摄入经验'
  )
`);